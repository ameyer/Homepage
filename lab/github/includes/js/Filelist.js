var GHE_Filelist = new Class({
	Implements: [Events],
	initialize: function(wrapper){
		this.wrapper = document.id(wrapper);
		
		this.buildUI();
	},
	buildUI: function(){
		this.body = new Element('div', {'class': 'fileList'}).inject(this.wrapper);
			this.fileHousing = new Element('div', {'class': 'fileHousing'}).inject(this.body);
		//console.log(this);
	},
});
