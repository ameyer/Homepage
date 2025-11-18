var GHE_Folder = new Class({
	Implements: [Events],
	initialize: function(wrapper, data, name){
		this.data = data;
		this.name = name;
		this.sha = data.sha;
		this.url = data.url;
		this.mode = data.mode;
		this.wrapper = document.id(wrapper);
		
		this.buildUI();
	},
	buildUI: function(){
		this.folderWrapper = new Element('div', {'class': 'folderWrapper'}).inject(this.wrapper);
			this.body = new Element('div', {'class': 'folder'}).inject(this.folderWrapper);
				this.nameEl = new Element('div', {'class': 'name', html: this.name}).inject(this.body);
			this.fileHousing = new Element('div', {'class': 'fileHousing'}).inject(this.folderWrapper);
		this.body.addEvent('click', this.clicked.bind(this));
	},
	clicked: function(){
		this.fireEvent('clicked', this);
	},
	addFile: function(file){
		this.fileHousing.inject(file.body);
	}
});