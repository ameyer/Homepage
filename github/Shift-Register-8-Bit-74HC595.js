document.write('<link rel="stylesheet" href="../arduino/style/githubEmbed.css"/>');document.write('<link rel="stylesheet" href="../arduino/style/githubEmbed.css"/>');/*
---
script: Fx.Scroll.js
name: Fx.Scroll
description: Effect to smoothly scroll any element, including the window.
license: MIT-style license
authors:
  - Valerio Proietti
requires:
  - Core/Fx
  - Core/Element.Event
  - Core/Element.Dimensions
  - MooTools.More
provides: [Fx.Scroll]
...
*/

function GHE_isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
}

Fx.Scroll = new Class({
	Extends: Fx,
	options: {
		offset: {x: 0, y: 0},
		wheelStops: true
	},
	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
		if (typeOf(this.element) != 'element') this.element = document.id(this.element.getDocument().body);
		if (this.options.wheelStops){
			var stopper = this.element,
				cancel = this.cancel.pass(false, this);
			this.addEvent('start', function(){
				stopper.addEvent('mousewheel', cancel);
			}, true);
			this.addEvent('complete', function(){
				stopper.removeEvent('mousewheel', cancel);
			}, true);
		}
	},
	set: function(){
		var now = Array.flatten(arguments);
		if (Browser.firefox) now = [Math.round(now[0]), Math.round(now[1])]; // not needed anymore in newer firefox versions
		this.element.scrollTo(now[0], now[1]);
		return this;
	},
	compute: function(from, to, delta){
		return [0, 1].map(function(i){
			return Fx.compute(from[i], to[i], delta);
		});
	},
	start: function(x, y){
		if (!this.check(x, y)) return this;
		var scroll = this.element.getScroll();
		return this.parent([scroll.x, scroll.y], [x, y]);
	},
	calculateScroll: function(x, y){
		var element = this.element,
			scrollSize = element.getScrollSize(),
			scroll = element.getScroll(),
			size = element.getSize(),
			offset = this.options.offset,
			values = {x: x, y: y};
		for (var z in values){
			if (!values[z] && values[z] !== 0) values[z] = scroll[z];
			if (typeOf(values[z]) != 'number') values[z] = scrollSize[z] - size[z];
			values[z] += offset[z];
		}
		return [values.x, values.y];
	},
	toElement: function(el, axes){
		axes = axes ? Array.from(axes) : ['x', 'y'];
		var scroll = GHE_isBody(this.element) ? {x: 0, y: 0} : this.element.getScroll();
		var position = Object.map(document.id(el).getPosition(this.element), function(value, axis){
			return axes.contains(axis) ? value + scroll[axis] : false;
		});
		return this.start.apply(this, this.calculateScroll(position.x, position.y));
	}
});

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
});var GHE_Filelist = new Class({
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
});var GHE_Folder = new Class({
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
document.write('<div class=\"githubEmbed_projectWrapper\"><div class=\"projectHeader\" ><span class=\"projectTitle\"><a title=\"github.com: ameyer/Shift-Register-8-Bit-74HC595\" href=\"http://github.com/ameyer/Shift-Register-8-Bit-74HC595\">Shift-Register-8-Bit-74HC595</a> </span><a class=\"downloadButton\" title=\"download prject from github\" href=\"https://github.com/ameyer/Shift-Register-8-Bit-74HC595/archive/master.zip\">download</a></div><div class=\"body\"><div class=\"sideBar\" id=\"Shift-Register-8-Bit-74HC595_sidebar\"></div><div class=\"projectCode\" id=\"Shift-Register-8-Bit-74HC595_code\">   <div class=\"fileWrapper txt\" id=\"b132efea8543fe82d1fd16a19298a9840f395e17\">  <p class=\"fileHead\">License.txt</p>    <div class=\"fileCodeWrapper\">    <div class=\"lineNumbers\">  1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10<br />11<br />12<br />13<br />14<br />15<br />16<br />17<br />18<br />19<br />20<br />  </div>  <div class=\"code\">  <pre class=\"code\"><code>Copyright (c) 2010 bildr community<br /><br />Permission is hereby granted, free of charge, to any person obtaining a copy<br />of this software and associated documentation files (the &quot;Software&quot;), to deal<br />in the Software without restriction, including without limitation the rights<br />to use, copy, modify, merge, publish, distribute, sublicense, and/or sell<br />copies of the Software, and to permit persons to whom the Software is<br />furnished to do so, subject to the following conditions:<br /><br />The above copyright notice and this permission notice shall be included in<br />all copies or substantial portions of the Software.<br /><br />THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR<br />IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,<br />FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE<br />AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER<br />LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,<br />OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN<br />THE SOFTWARE.</code></pre>  </div>  </div>  </div>      <div class=\"fileWrapper md\" id=\"38946bdaf487d66f22b8f87721d780cb405a084f\">  <p class=\"fileHead\">README.md</p>    <div class=\"fileCodeWrapper\">    <div class=\"code\">  <div class=\"markdown\"><h1>74HC595 8-bit Shift-Register</h1><p>Arduino code to control the 74HC595 8-bit Shift-Register</p><p>For complete hookup and tutorial see: <a href=\"http://adam-meyer.com/arduino/74hc595\">http://adam-meyer.com/arduino/74hc595</a></p><p>The code is provided under the MIT license please use, edit, change, and share. </p><p><em>Before loading the shifter_example code, or even opening the arduino software, place the Shifter folder in your arduino library.</em></p><h5>ARDUINO LIBRARY LOCATION</h5><ul><li>On your Mac:: In (home directory)/Documents/Arduino/libraries  </li><li>On your PC:: My Documents -&gt; Arduino -&gt; libraries  </li><li>On your Linux box: (home directory)/sketchbook/libraries  </li></ul><p>For all my arduino articles: <a href=\"http://adam-meyer.com/arduino/\">http://adam-meyer.com/arduino/</a></p></div>  </div>  </div>  </div>      <div class=\"fileWrapper cpp\" id=\"64a9956e80a9aedf2242c89f9c3f7b2581600c3b\">  <p class=\"fileHead\">Shifter.cpp</p>    <div class=\"fileCodeWrapper\">    <div class=\"lineNumbers\">  1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10<br />11<br />12<br />13<br />14<br />15<br />16<br />17<br />18<br />19<br />20<br />21<br />22<br />23<br />24<br />25<br />26<br />27<br />28<br />29<br />30<br />31<br />32<br />33<br />34<br />35<br />36<br />37<br />38<br />39<br />40<br />41<br />42<br />43<br />44<br />45<br />46<br />47<br />48<br />49<br />50<br />51<br />52<br />53<br />54<br />55<br />56<br />57<br />58<br />59<br />60<br />61<br />62<br />63<br />64<br />65<br />66<br />67<br />68<br />69<br />70<br />71<br />72<br />73<br />74<br />75<br />76<br />  </div>  <div class=\"code\">  <pre class=\"code\"><code><span class=\"co1\">// Include the standard types</span><br /><span class=\"co2\">#include &lt;Arduino.h&gt;</span><br /><span class=\"co2\">#include &lt;Shifter.h&gt;</span><br /><br /><br /><span class=\"co1\">// Constructor</span><br />Shifter<span class=\"sy0\">::</span><span class=\"me2\">Shifter</span><span class=\"br0\">&#40;</span><span class=\"kw4\">int</span> SER_Pin<span class=\"sy0\">,</span> <span class=\"kw4\">int</span> RCLK_Pin<span class=\"sy0\">,</span> <span class=\"kw4\">int</span> SRCLK_Pin<span class=\"sy0\">,</span> <span class=\"kw4\">int</span> Number_of_Registers<span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span>  <br />    _SER_Pin <span class=\"sy0\">=</span> SER_Pin<span class=\"sy0\">;</span><br />    _RCLK_Pin <span class=\"sy0\">=</span> RCLK_Pin<span class=\"sy0\">;</span><br />    _SRCLK_Pin <span class=\"sy0\">=</span> SRCLK_Pin<span class=\"sy0\">;</span><br />    <br />    _Number_of_Registers <span class=\"sy0\">=</span> Number_of_Registers<span class=\"sy0\">;</span><br />    <br />    <br />    pinMode<span class=\"br0\">&#40;</span>_SER_Pin<span class=\"sy0\">,</span> OUTPUT<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />    pinMode<span class=\"br0\">&#40;</span>_RCLK_Pin<span class=\"sy0\">,</span> OUTPUT<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />    pinMode<span class=\"br0\">&#40;</span>_SRCLK_Pin<span class=\"sy0\">,</span> OUTPUT<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />    <br />    <br />    clear<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <span class=\"co1\">//reset all register pins</span><br />    write<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /><span class=\"br0\">&#125;</span><br /><br /><span class=\"kw4\">void</span> Shifter<span class=\"sy0\">::</span><span class=\"me2\">write</span><span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />    <span class=\"co1\">//Set and display registers</span><br />    <span class=\"co1\">//Only call AFTER all values are set how you would like (slow otherwise)</span><br /><br /> digitalWrite<span class=\"br0\">&#40;</span>_RCLK_Pin<span class=\"sy0\">,</span> LOW<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> <span class=\"co1\">//iterate through the registers</span><br /> <span class=\"kw1\">for</span><span class=\"br0\">&#40;</span><span class=\"kw4\">int</span> i <span class=\"sy0\">=</span> _Number_of_Registers <span class=\"sy0\">-</span> <span class=\"nu0\">1</span><span class=\"sy0\">;</span> i <span class=\"sy0\">&gt;=</span> <span class=\"nu0\">0</span><span class=\"sy0\">;</span> i<span class=\"sy0\">--</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />  <br />  <span class=\"co1\">//iterate through the bits in each registers</span><br />  <span class=\"kw1\">for</span><span class=\"br0\">&#40;</span><span class=\"kw4\">int</span> j <span class=\"sy0\">=</span> 8 <span class=\"sy0\">-</span> <span class=\"nu0\">1</span><span class=\"sy0\">;</span> j <span class=\"sy0\">&gt;=</span> <span class=\"nu0\">0</span><span class=\"sy0\">;</span> j<span class=\"sy0\">--</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />   <br />   digitalWrite<span class=\"br0\">&#40;</span>_SRCLK_Pin<span class=\"sy0\">,</span> LOW<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span>  <br />   <br />   <span class=\"kw4\">int</span> val <span class=\"sy0\">=</span> _shiftRegisters<span class=\"br0\">&#91;</span>i<span class=\"br0\">&#93;</span> <span class=\"sy0\">&amp;</span> <span class=\"br0\">&#40;</span>1 <span class=\"sy0\">&lt;&lt;</span> j<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />   <br />   digitalWrite<span class=\"br0\">&#40;</span>_SER_Pin<span class=\"sy0\">,</span> val<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />   digitalWrite<span class=\"br0\">&#40;</span>_SRCLK_Pin<span class=\"sy0\">,</span> HIGH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />  <br />  <span class=\"br0\">&#125;</span><br /> <br /> <span class=\"br0\">&#125;</span><br /> <br /> digitalWrite<span class=\"br0\">&#40;</span>_RCLK_Pin<span class=\"sy0\">,</span> HIGH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /><span class=\"br0\">&#125;</span><br />    <br /><span class=\"kw4\">void</span> Shifter<span class=\"sy0\">::</span><span class=\"me2\">setPin</span><span class=\"br0\">&#40;</span><span class=\"kw4\">int</span> index<span class=\"sy0\">,</span> boolean val<span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />    <span class=\"kw4\">int</span> byteIndex <span class=\"sy0\">=</span> index<span class=\"sy0\">/</span><span class=\"nu0\">8</span><span class=\"sy0\">;</span><br />    <span class=\"kw4\">int</span> bitIndex <span class=\"sy0\">=</span> index <span class=\"sy0\">%</span> <span class=\"nu0\">8</span><span class=\"sy0\">;</span><br />    <br />    byte current <span class=\"sy0\">=</span> _shiftRegisters<span class=\"br0\">&#91;</span>byteIndex<span class=\"br0\">&#93;</span><span class=\"sy0\">;</span><br />    <br />    current <span class=\"sy0\">&amp;=</span> ~<span class=\"br0\">&#40;</span>1 <span class=\"sy0\">&lt;&lt;</span> bitIndex<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <span class=\"co1\">//clear the bit</span><br />    current <span class=\"sy0\">|=</span> val <span class=\"sy0\">&lt;&lt;</span> bitIndex<span class=\"sy0\">;</span> <span class=\"co1\">//set the bit</span><br />    <br />    _shiftRegisters<span class=\"br0\">&#91;</span>byteIndex<span class=\"br0\">&#93;</span> <span class=\"sy0\">=</span> current<span class=\"sy0\">;</span> <span class=\"co1\">//set the value</span><br /><span class=\"br0\">&#125;</span><br /><br /><span class=\"kw4\">void</span> Shifter<span class=\"sy0\">::</span><span class=\"me2\">setAll</span><span class=\"br0\">&#40;</span>boolean val<span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br /><span class=\"co1\">//set all register pins to LOW </span><br /> <span class=\"kw1\">for</span><span class=\"br0\">&#40;</span><span class=\"kw4\">int</span> i <span class=\"sy0\">=</span> _Number_of_Registers <span class=\"sy0\">*</span> 8 <span class=\"sy0\">-</span> <span class=\"nu0\">1</span><span class=\"sy0\">;</span> i <span class=\"sy0\">&gt;=</span> <span class=\"nu0\">0</span><span class=\"sy0\">;</span> i<span class=\"sy0\">--</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />  setPin<span class=\"br0\">&#40;</span>i<span class=\"sy0\">,</span> val<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <span class=\"br0\">&#125;</span><br /><span class=\"br0\">&#125;</span><br /><br /><br /><span class=\"kw4\">void</span> Shifter<span class=\"sy0\">::</span><span class=\"me2\">clear</span><span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br /><span class=\"co1\">//set all register pins to LOW </span><br /> <span class=\"kw1\">for</span><span class=\"br0\">&#40;</span><span class=\"kw4\">int</span> i <span class=\"sy0\">=</span> _Number_of_Registers <span class=\"sy0\">*</span> 8 <span class=\"sy0\">-</span> <span class=\"nu0\">1</span><span class=\"sy0\">;</span> i <span class=\"sy0\">&gt;=</span> <span class=\"nu0\">0</span><span class=\"sy0\">;</span> i<span class=\"sy0\">--</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />  setPin<span class=\"br0\">&#40;</span>i<span class=\"sy0\">,</span> LOW<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <span class=\"br0\">&#125;</span><br /><span class=\"br0\">&#125;</span></code></pre>  </div>  </div>  </div>      <div class=\"fileWrapper h\" id=\"ebedd53ceea2d4a55d4c82dfcbd094aaa8391732\">  <p class=\"fileHead\">Shifter.h</p>    <div class=\"fileCodeWrapper\">    <div class=\"lineNumbers\">  1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10<br />11<br />12<br />13<br />14<br />15<br />16<br />17<br />18<br />19<br />20<br />21<br />22<br />23<br />24<br />25<br />26<br />27<br />28<br />29<br />  </div>  <div class=\"code\">  <pre class=\"code\"><code><span class=\"co2\">#ifndef Shifter_h</span><br /><span class=\"co2\">#define Shifter_h</span><br /><br /><span class=\"co1\">// Include the standard types</span><br /><span class=\"co2\">#include &lt;Arduino.h&gt;</span><br /><br /><span class=\"co1\">// Define the Shifter class</span><br />class Shifter<br /><span class=\"br0\">&#123;</span><br /> public<span class=\"sy0\">:</span><br />  <span class=\"co1\">// Constructor</span><br />  Shifter<span class=\"br0\">&#40;</span><span class=\"kw4\">int</span> SER_Pin<span class=\"sy0\">,</span> <span class=\"kw4\">int</span> RCLK_Pin<span class=\"sy0\">,</span> <span class=\"kw4\">int</span> SRCLK_Pin<span class=\"sy0\">,</span> <span class=\"kw4\">int</span> Number_of_Registers<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />    <span class=\"kw4\">void</span> write<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />    <span class=\"kw4\">void</span> setPin<span class=\"br0\">&#40;</span><span class=\"kw4\">int</span> index<span class=\"sy0\">,</span> boolean val<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />    <span class=\"kw4\">void</span> setAll<span class=\"br0\">&#40;</span>boolean val<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />    <span class=\"kw4\">void</span> clear<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /><br /><br /><br /> private<span class=\"sy0\">:</span><br />    <span class=\"kw4\">int</span> _SER_Pin<span class=\"sy0\">;</span><br />    <span class=\"kw4\">int</span> _RCLK_Pin<span class=\"sy0\">;</span><br />    <span class=\"kw4\">int</span> _SRCLK_Pin<span class=\"sy0\">;</span><br />    <span class=\"kw4\">int</span> _Number_of_Registers<span class=\"sy0\">;</span><br />    byte _shiftRegisters<span class=\"br0\">&#91;</span>25<span class=\"br0\">&#93;</span><span class=\"sy0\">;</span><br /><span class=\"br0\">&#125;</span><span class=\"sy0\">;</span><br /><br /><span class=\"co2\">#endif //Shifter_h</span></code></pre>  </div>  </div>  </div>      <div class=\"fileWrapper txt\" id=\"3f19db05f9007f293566b455b6c97a178a3a9f96\">  <p class=\"fileHead\">keywords.txt</p>    <div class=\"fileCodeWrapper\">    <div class=\"lineNumbers\">  1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10<br />11<br />12<br />13<br />14<br />15<br />16<br />17<br />18<br />19<br />20<br />21<br />22<br />23<br />24<br />25<br />26<br />27<br />28<br />29<br />  </div>  <div class=\"code\">  <pre class=\"code\"><code>#######################################################<br /># keywords.txt - keywords file for the Shifter library<br /><br /># Created by Adam Meyer of bildr<br /><br /># Released as MIT license<br /><br />#######################################################<br /><br /><br />#######################################<br /># Datatypes (KEYWORD1)<br />#######################################<br /><br />Shifter KEYWORD1<br /><br />#######################################<br /># Methods and Functions (KEYWORD2)<br />#######################################<br /><br />write  KEYWORD2<br />setPin KEYWORD2<br />clear  KEYWORD2<br />setAll KEYWORD2<br /><br />#######################################<br /># Constants (LITERAL1)<br />#######################################</code></pre>  </div>  </div>  </div>      <div class=\"fileWrapper ino\" id=\"750747f99f6be8617a9bb1f227b2cd3538b428f5\">  <p class=\"fileHead\">shifter_example.ino</p>    <div class=\"fileCodeWrapper\">    <div class=\"lineNumbers\">  1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10<br />11<br />12<br />13<br />14<br />15<br />16<br />17<br />18<br />19<br />20<br />21<br />22<br />23<br />24<br />25<br />26<br />27<br />28<br />29<br />30<br />31<br />32<br />33<br />34<br />35<br />36<br />37<br />38<br />39<br />40<br />  </div>  <div class=\"code\">  <pre class=\"code\"><code><span class=\"co2\">#include &lt;Shifter.h&gt;</span><br /><br /><span class=\"co2\">#define SER_Pin 4 //SER_IN</span><br /><span class=\"co2\">#define RCLK_Pin 3 //L_CLOCK</span><br /><span class=\"co2\">#define SRCLK_Pin 2 //CLOCK</span><br /><br /><span class=\"co2\">#define NUM_REGISTERS 5 //how many registers are in the chain</span><br /><br /><br /><span class=\"co1\">//initaize shifter using the Shifter library</span><br />Shifter shifter<span class=\"br0\">&#40;</span>SER_Pin<span class=\"sy0\">,</span> RCLK_Pin<span class=\"sy0\">,</span> SRCLK_Pin<span class=\"sy0\">,</span> NUM_REGISTERS<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <br /><br /><span class=\"kw4\">void</span> setup<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br /><br /><span class=\"br0\">&#125;</span><br /><br /><span class=\"kw4\">void</span> loop<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br /> shifter.<span class=\"me1\">clear</span><span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <span class=\"co1\">//set all pins on the shift register chain to LOW</span><br /> shifter.<span class=\"me1\">write</span><span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <span class=\"co1\">//send changes to the chain and display them</span><br />  <br /> <a href=\"geshi/redirect.php?language=arduino&search=delay\"><span class=\"kw3\">delay</span></a><span class=\"br0\">&#40;</span>1000<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> shifter.<span class=\"me1\">setPin</span><span class=\"br0\">&#40;</span>1<span class=\"sy0\">,</span> <span class=\"kw2\">HIGH</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <span class=\"co1\">//set pin 1 in the chain(second pin) HIGH</span><br /> shifter.<span class=\"me1\">setPin</span><span class=\"br0\">&#40;</span>3<span class=\"sy0\">,</span> <span class=\"kw2\">HIGH</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> shifter.<span class=\"me1\">setPin</span><span class=\"br0\">&#40;</span>5<span class=\"sy0\">,</span> <span class=\"kw2\">HIGH</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> shifter.<span class=\"me1\">setPin</span><span class=\"br0\">&#40;</span>7<span class=\"sy0\">,</span> <span class=\"kw2\">HIGH</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> shifter.<span class=\"me1\">write</span><span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <span class=\"co1\">//send changes to the chain and display them</span><br /> <span class=\"co1\">//notice how you only call write after you make all the changes you want to make</span><br /> <br /> <a href=\"geshi/redirect.php?language=arduino&search=delay\"><span class=\"kw3\">delay</span></a><span class=\"br0\">&#40;</span>1000<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> <br /> shifter.<span class=\"me1\">setAll</span><span class=\"br0\">&#40;</span><span class=\"kw2\">HIGH</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <span class=\"co1\">//Set all pins on the chain high</span><br /> shifter.<span class=\"me1\">write</span><span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <span class=\"co1\">//send changes to the chain and display them</span><br /> <br /> <a href=\"geshi/redirect.php?language=arduino&search=delay\"><span class=\"kw3\">delay</span></a><span class=\"br0\">&#40;</span>1000<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /><span class=\"br0\">&#125;</span></code></pre>  </div>  </div>  </div>    </div></div><div class=\"footer\">powered by <a title=\"github.com\" href=\"http://github.com\">github</a><!-- Served in 0.0060601234436035 sec - loaded from cache: yes - limitLeft:  of  --!></div></div>');
new Embed("Shift-Register-8-Bit-74HC595_sidebar", "Shift-Register-8-Bit-74HC595_code", {"sha":"3b682595c67ed22921dfd36df0eb1f43889478b2","url":"https:\/\/api.github.com\/repos\/ameyer\/Shift-Register-8-Bit-74HC595\/git\/trees\/3b682595c67ed22921dfd36df0eb1f43889478b2","tree":[{"path":"License.txt","mode":"100755","type":"blob","sha":"b132efea8543fe82d1fd16a19298a9840f395e17","size":1073,"url":"https:\/\/api.github.com\/repos\/ameyer\/Shift-Register-8-Bit-74HC595\/git\/blobs\/b132efea8543fe82d1fd16a19298a9840f395e17"},{"path":"README.md","mode":"100644","type":"blob","sha":"38946bdaf487d66f22b8f87721d780cb405a084f","size":654,"url":"https:\/\/api.github.com\/repos\/ameyer\/Shift-Register-8-Bit-74HC595\/git\/blobs\/38946bdaf487d66f22b8f87721d780cb405a084f"},{"path":"Shifter\/Shifter.cpp","mode":"100755","type":"blob","sha":"64a9956e80a9aedf2242c89f9c3f7b2581600c3b","size":1611,"url":"https:\/\/api.github.com\/repos\/ameyer\/Shift-Register-8-Bit-74HC595\/git\/blobs\/64a9956e80a9aedf2242c89f9c3f7b2581600c3b"},{"path":"Shifter\/Shifter.h","mode":"100755","type":"blob","sha":"ebedd53ceea2d4a55d4c82dfcbd094aaa8391732","size":495,"url":"https:\/\/api.github.com\/repos\/ameyer\/Shift-Register-8-Bit-74HC595\/git\/blobs\/ebedd53ceea2d4a55d4c82dfcbd094aaa8391732"},{"path":"Shifter\/keywords.txt","mode":"100755","type":"blob","sha":"3f19db05f9007f293566b455b6c97a178a3a9f96","size":637,"url":"https:\/\/api.github.com\/repos\/ameyer\/Shift-Register-8-Bit-74HC595\/git\/blobs\/3f19db05f9007f293566b455b6c97a178a3a9f96"},{"path":"shifter_example.ino","mode":"100755","type":"blob","sha":"750747f99f6be8617a9bb1f227b2cd3538b428f5","size":934,"url":"https:\/\/api.github.com\/repos\/ameyer\/Shift-Register-8-Bit-74HC595\/git\/blobs\/750747f99f6be8617a9bb1f227b2cd3538b428f5"}],"truncated":false})

<!-- Served in 0.0062839984893799 sec - loaded from cache: yes - limitLeft:  of  --!>