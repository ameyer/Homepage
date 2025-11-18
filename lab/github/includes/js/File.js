var GHE_File = new Class({
	Implements: [Events],
	initialize: function(wrapper, data){
		this.data = data;
		this.name = data.name;
		this.sha = data.sha;
		this.url = data.url;
		this.mode = data.mode;
		this.wrapper = document.id(wrapper);
		this.buildUI();
	},
	buildUI: function(){
		this.body = new Element('div', {'class': 'file'}).inject(this.wrapper);
			this.nameEl = new Element('div', {'class': 'name', html: this.data.name}).inject(this.body);
		this.body.addEvent('click', this.clicked.bind(this));
	},
	clicked: function(){
		this.fireEvent('clicked', this);
	},
	select: function(){
		this.body.addClass('selected');
	},
	unselect: function(){
		this.body.removeClass('selected');
	}
});