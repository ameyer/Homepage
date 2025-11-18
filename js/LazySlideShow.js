var LazySlideShow = new Class({

	Implements: [Options, Events],

	options: {
		homeSlideshowId: 'homeSlideshow',
		homeSlideClass: 'homeSlide',
		interval: 3000,
		imageBase: 'images/bildr/slides/',
		left: 300,
		moveImageTo: -700,
		offScreenPos: 1300,
		images: [
			
		],
		tweenOptions: {
			duration: 'long',
			transition: Fx.Transitions.Quad.easeInOut,
			link: 'chain',
			property: 'left'
		}	
	},

	initialize: function(wrapper, options){
	
		this.wrapper = document.id(wrapper);
		this.setOptions(options);
		
		this.images = this.options.images;			
		this.slideshowIndex = 0;
		this.homeSlideshowIndex = 0;
		this.pauseSlideshow = false;
		this.slideshowImages = new Array();
	
		
		this.homeShowWrapper = new Element('div', {'id': this.options.homeSlideshowId}).inject(this.wrapper);
		
		this.loadImagesInOrder(this.options.imageBase + this.images[this.slideshowIndex]);
		this.periodic = this.auto.bind(this).periodical(this.options.interval);
		
	},
	
	
	loadImagesInOrder: function(image){		
			if(this.slideshowIndex == this.images.length){
			return;
		}
		
		var myImage = new Asset.image(image, {
			onload: function(){
				

				var imageObj = {
					image: myImage,
					tween: new Fx.Tween(myImage, this.options.tweenOptions)
				}
				
				imageObj.tween.set(-700);

				
				var heldIndex = this.slideshowImages.push(imageObj) -1;

				myImage.addClass(this.options.homeSlideClass);
				myImage.inject(this.homeShowWrapper); //.fade('hide');
				
				if(this.slideshowIndex == 0) imageObj.tween.start(this.options.offScreenPos, this.options.left);
				
				this.slideshowIndex ++;
				this.loadImagesInOrder(this.options.imageBase + this.images[this.slideshowIndex]);
								
			}.bind(this)
		});
	},
	
	
		
	pause: function() {
		this.pauseSlideshow = true;
	},
	
	play: function() {
		this.pauseSlideshow = false;
	},
	
	auto: function() {
		this.fireEvent('onInterval');
	
		if(!this.pauseSlideshow && this.slideshowImages.length > 1){
			this.next();
		}
	},
	
	next: function() {
		index = (this.homeSlideshowIndex != this.slideshowImages.length - 1)? this.homeSlideshowIndex +1: 0;
		this.showSlide(index);
	},
	
	prev: function() {
		index = (this.homeSlideshowIndex != 0)? this.homeSlideshowIndex -1: this.slideshowImages.length - 1;
		thisshowSlide(index);
	},
	
	
	showSlide: function(index){	
		this.fireEvent('onChanged');
		
		index = (index < 0)? 0: index;
		index = (index > this.slideshowImages.length -1)? this.slideshowImages.length -1: index;
		
		console.log(this.homeSlideshowIndex);
		console.log(index);
		
		
		var image = this.slideshowImages[this.homeSlideshowIndex];
		this.homeSlideshowIndex = index;
		var nextImage = this.slideshowImages[index];	
		
		
					
		if(image){
			image.tween.start(this.options.moveImageTo);
		}	
		
		if(nextImage){
			nextImage.tween.start(this.options.offScreenPos, this.options.left);
		}
	}

});


var Asset = {

	image: function(source, properties){
		if (!properties) properties = {};

		var image = new Image(),
			element = document.id(image) || new Element('img');

		['load', 'abort', 'error'].each(function(name){
			var type = 'on' + name,
				cap = 'on' + name.capitalize(),
				event = properties[type] || properties[cap] || function(){};

			delete properties[cap];
			delete properties[type];

			image[type] = function(){
				if (!image) return;
				if (!element.parentNode){
					element.width = image.width;
					element.height = image.height;
				}
				image = image.onload = image.onabort = image.onerror = null;
				event.delay(1, element, element);
				element.fireEvent(name, element, 1);
			};
		});

		image.src = element.src = source;
		if (image && image.complete) image.onload.delay(1);
		return element.set(properties);
	},

	images: function(sources, options){
		sources = Array.from(sources);

		var fn = function(){},
			counter = 0;

		options = Object.merge({
			onComplete: fn,
			onProgress: fn,
			onError: fn,
			properties: {}
		}, options);

		return new Elements(sources.map(function(source, index){
			return Asset.image(source, Object.append(options.properties, {
				onload: function(){
					counter++;
					options.onProgress.call(this, counter, index, source);
					if (counter == sources.length) options.onComplete();
				},
				onerror: function(){
					counter++;
					options.onError.call(this, counter, index, source);
					if (counter == sources.length) options.onComplete();
				}
			}));
		}));
	}

};

