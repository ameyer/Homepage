var Embed = new Class({
	Implements: [Events],
	initialize: function(wrapper, codeWrapper, data){

		this.wrapper = document.id(wrapper);
		this.codeWrapper = document.id(codeWrapper);
		this.data = data;
		this.codeScroll = new Fx.Scroll(this.codeWrapper, {link: 'cancel'});
		this.files = [];
		this.rawTree = [];
		for (var i = 0; i < data.tree.length; i++) {
			var file = {};
			file.path = this.getPath(this.data.tree[i].path);
			file.mode = this.data.tree[i].mode;
			file.sha = this.data.tree[i].sha;
			file.url = this.data.tree[i].url;
			file.name = file.path.pop();
			file.extension = file.name.split('.').pop();
			file.type = (this.data.tree[i].type == "tree")? 'folder' : 'file';
			this.rawTree.push(file);
		}
		this.filelist = new GHE_Filelist(this.wrapper);
		//loop through files, and make structure.
		for (var i = 0; i < this.rawTree.length; i++) {
			var file = this.rawTree[i];
			var path = this.filelist;
			//find/create file path
			while(file.path.length > 0){
				var segment = file.path.shift();
				if(!path[segment]){
					path[segment] =  new GHE_Folder(path.fileHousing, file, segment);
				}
				path = path[segment];
			}
			if(file.type == 'file'){
				if(file.extension != 'gitignore' && file.extension != 'pdf'){
					path[file.name] = new GHE_File(path.fileHousing,file);
					path[file.name].addEvent('clicked', this.fileClicked.bind(this));
					this.files.push(path[file.name]);
				}
			}else{
				path[file.name] = new GHE_Folder(path.fileHousing,file);
			}
		}
		this.files[0].select();
		console.log(this.fileList);
	},
	fileClicked: function(file){
		for (var i = 0; i < this.files.length; i++) {
			this.files[i].unselect();
		}
		file.select();
		console.log(file);
		this.codeScroll.toElement(document.id(file.sha));
	},
	getPath: function(path){
		return path.split("/");
	}
});