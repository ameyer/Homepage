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
document.write('<div class=\"githubEmbed_projectWrapper\"><div class=\"projectHeader\" ><span class=\"projectTitle\"><a title=\"github.com: ameyer/MPR121\" href=\"http://github.com/ameyer/MPR121\">MPR121</a> </span><a class=\"downloadButton\" title=\"download prject from github\" href=\"https://github.com/ameyer/MPR121/archive/master.zip\">download</a></div><div class=\"body\"><div class=\"sideBar\" id=\"MPR121_sidebar\"></div><div class=\"projectCode\" id=\"MPR121_code\">   <div class=\"fileWrapper txt\" id=\"b132efea8543fe82d1fd16a19298a9840f395e17\">  <p class=\"fileHead\">License.txt</p>    <div class=\"fileCodeWrapper\">    <div class=\"lineNumbers\">  1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10<br />11<br />12<br />13<br />14<br />15<br />16<br />17<br />18<br />19<br />20<br />  </div>  <div class=\"code\">  <pre class=\"code\"><code>Copyright (c) 2010 bildr community<br /><br />Permission is hereby granted, free of charge, to any person obtaining a copy<br />of this software and associated documentation files (the &quot;Software&quot;), to deal<br />in the Software without restriction, including without limitation the rights<br />to use, copy, modify, merge, publish, distribute, sublicense, and/or sell<br />copies of the Software, and to permit persons to whom the Software is<br />furnished to do so, subject to the following conditions:<br /><br />The above copyright notice and this permission notice shall be included in<br />all copies or substantial portions of the Software.<br /><br />THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR<br />IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,<br />FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE<br />AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER<br />LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,<br />OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN<br />THE SOFTWARE.</code></pre>  </div>  </div>  </div>      <div class=\"fileWrapper md\" id=\"109964718325fa3a3d9f8946cc1514193ce601e8\">  <p class=\"fileHead\">README.md</p>    <div class=\"fileCodeWrapper\">    <div class=\"code\">  <div class=\"markdown\"><h1>MPR121</h1><p>Arduino code for the MPR121 Capacitive Touch Sensor <a href=\"https://www.sparkfun.com/products/retired/9695\">https://www.sparkfun.com/products/retired/9695</a></p><p>For complete hookup and tutorial see: <a href=\"http://adam-meyer.com/arduino/mpr121\">http://adam-meyer.com/arduino/mpr121</a></p><p>For all my arduino articles: <a href=\"http://adam-meyer.com/arduino/\">http://adam-meyer.com/arduino/</a></p><p>The code is provided under the MIT license please use, edit, change, and share. </p></div>  </div>  </div>  </div>      <div class=\"fileWrapper h\" id=\"bb88a2beaf385f3f9fe35d7d56f2e610934fff33\">  <p class=\"fileHead\">mpr121.h</p>    <div class=\"fileCodeWrapper\">    <div class=\"lineNumbers\">  1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10<br />11<br />12<br />13<br />14<br />15<br />16<br />17<br />18<br />19<br />20<br />21<br />22<br />23<br />24<br />25<br />26<br />27<br />28<br />29<br />30<br />31<br />32<br />33<br />34<br />35<br />36<br />37<br />38<br />39<br />40<br />41<br />42<br />43<br />44<br />45<br />46<br />47<br />48<br />49<br />50<br />51<br />52<br />53<br />54<br />55<br />56<br />57<br />58<br />59<br />  </div>  <div class=\"code\">  <pre class=\"code\"><code><span class=\"coMULTI\">/*<br />  MPR121.h<br />    April 8, 2010<br />    by: Jim Lindblom<br />*/</span><br /><br /><span class=\"co1\">// MPR121 Register Defines</span><br /><span class=\"co2\">#define MHD_R  0x2B</span><br /><span class=\"co2\">#define NHD_R  0x2C</span><br /><span class=\"co2\">#define NCL_R  0x2D</span><br /><span class=\"co2\">#define FDL_R  0x2E</span><br /><span class=\"co2\">#define MHD_F  0x2F</span><br /><span class=\"co2\">#define NHD_F  0x30</span><br /><span class=\"co2\">#define NCL_F  0x31</span><br /><span class=\"co2\">#define FDL_F  0x32</span><br /><span class=\"co2\">#define ELE0_T 0x41</span><br /><span class=\"co2\">#define ELE0_R 0x42</span><br /><span class=\"co2\">#define ELE1_T 0x43</span><br /><span class=\"co2\">#define ELE1_R 0x44</span><br /><span class=\"co2\">#define ELE2_T 0x45</span><br /><span class=\"co2\">#define ELE2_R 0x46</span><br /><span class=\"co2\">#define ELE3_T 0x47</span><br /><span class=\"co2\">#define ELE3_R 0x48</span><br /><span class=\"co2\">#define ELE4_T 0x49</span><br /><span class=\"co2\">#define ELE4_R 0x4A</span><br /><span class=\"co2\">#define ELE5_T 0x4B</span><br /><span class=\"co2\">#define ELE5_R 0x4C</span><br /><span class=\"co2\">#define ELE6_T 0x4D</span><br /><span class=\"co2\">#define ELE6_R 0x4E</span><br /><span class=\"co2\">#define ELE7_T 0x4F</span><br /><span class=\"co2\">#define ELE7_R 0x50</span><br /><span class=\"co2\">#define ELE8_T 0x51</span><br /><span class=\"co2\">#define ELE8_R 0x52</span><br /><span class=\"co2\">#define ELE9_T 0x53</span><br /><span class=\"co2\">#define ELE9_R 0x54</span><br /><span class=\"co2\">#define ELE10_T 0x55</span><br /><span class=\"co2\">#define ELE10_R 0x56</span><br /><span class=\"co2\">#define ELE11_T 0x57</span><br /><span class=\"co2\">#define ELE11_R 0x58</span><br /><span class=\"co2\">#define FIL_CFG 0x5D</span><br /><span class=\"co2\">#define ELE_CFG 0x5E</span><br /><span class=\"co2\">#define GPIO_CTRL0   0x73</span><br /><span class=\"co2\">#define GPIO_CTRL1   0x74</span><br /><span class=\"co2\">#define GPIO_DATA    0x75</span><br /><span class=\"co2\">#define GPIO_DIR    0x76</span><br /><span class=\"co2\">#define GPIO_EN     0x77</span><br /><span class=\"co2\">#define GPIO_SET    0x78</span><br /><span class=\"co2\">#define GPIO_CLEAR   0x79</span><br /><span class=\"co2\">#define GPIO_TOGGLE   0x7A</span><br /><span class=\"co2\">#define ATO_CFG0    0x7B</span><br /><span class=\"co2\">#define ATO_CFGU    0x7D</span><br /><span class=\"co2\">#define ATO_CFGL    0x7E</span><br /><span class=\"co2\">#define ATO_CFGT    0x7F</span><br /><br /><br /><span class=\"co1\">// Global Constants</span><br /><span class=\"co2\">#define TOU_THRESH   0x06</span><br /><span class=\"co2\">#define REL_THRESH   0x0A</span></code></pre>  </div>  </div>  </div>      <div class=\"fileWrapper ino\" id=\"4db6a572f333dbbbeef090046679265055be8bb5\">  <p class=\"fileHead\">mpr121.ino</p>    <div class=\"fileCodeWrapper\">    <div class=\"lineNumbers\">  1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10<br />11<br />12<br />13<br />14<br />15<br />16<br />17<br />18<br />19<br />20<br />21<br />22<br />23<br />24<br />25<br />26<br />27<br />28<br />29<br />30<br />31<br />32<br />33<br />34<br />35<br />36<br />37<br />38<br />39<br />40<br />41<br />42<br />43<br />44<br />45<br />46<br />47<br />48<br />49<br />50<br />51<br />52<br />53<br />54<br />55<br />56<br />57<br />58<br />59<br />60<br />61<br />62<br />63<br />64<br />65<br />66<br />67<br />68<br />69<br />70<br />71<br />72<br />73<br />74<br />75<br />76<br />77<br />78<br />79<br />80<br />81<br />82<br />83<br />84<br />85<br />86<br />87<br />88<br />89<br />90<br />91<br />92<br />93<br />94<br />95<br />96<br />97<br />98<br />99<br />100<br />101<br />102<br />103<br />104<br />105<br />106<br />107<br />108<br />109<br />110<br />111<br />112<br />113<br />114<br />115<br />116<br />117<br />118<br />119<br />120<br />121<br />122<br />123<br />124<br />125<br />126<br />127<br />128<br />129<br />130<br />131<br />132<br />133<br />134<br />135<br />136<br />137<br />138<br />139<br />140<br />141<br />142<br />143<br />144<br />145<br />146<br />147<br />148<br />149<br />150<br />151<br />152<br />153<br />154<br />  </div>  <div class=\"code\">  <pre class=\"code\"><code><span class=\"co2\">#include &quot;mpr121.h&quot;</span><br /><span class=\"co2\">#include &lt;Wire.h&gt;</span><br /><br /><span class=\"kw4\">int</span> irqpin <span class=\"sy0\">=</span> <span class=\"nu0\">2</span><span class=\"sy0\">;</span> <span class=\"co1\">// Digital 2</span><br /><span class=\"kw4\">boolean</span> touchStates<span class=\"br0\">&#91;</span>12<span class=\"br0\">&#93;</span><span class=\"sy0\">;</span> <span class=\"co1\">//to keep track of the previous touch states</span><br /><br /><span class=\"kw4\">void</span> setup<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br /> <a href=\"geshi/redirect.php?language=arduino&search=pinMode\"><span class=\"kw3\">pinMode</span></a><span class=\"br0\">&#40;</span>irqpin<span class=\"sy0\">,</span> <span class=\"kw2\">INPUT</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <a href=\"geshi/redirect.php?language=arduino&search=digitalWrite\"><span class=\"kw3\">digitalWrite</span></a><span class=\"br0\">&#40;</span>irqpin<span class=\"sy0\">,</span> <span class=\"kw2\">HIGH</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <span class=\"co1\">//enable pullup resistor</span><br /> <br /> <a href=\"geshi/redirect.php?language=arduino&search=Serial\"><span class=\"kw3\">Serial</span></a>.<span class=\"me1\">begin</span><span class=\"br0\">&#40;</span>9600<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> Wire.<span class=\"me1\">begin</span><span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /><br /> mpr121_setup<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /><span class=\"br0\">&#125;</span><br /><br /><span class=\"kw4\">void</span> loop<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br /> readTouchInputs<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /><span class=\"br0\">&#125;</span><br /><br /><br /><span class=\"kw4\">void</span> readTouchInputs<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br /> <span class=\"kw1\">if</span><span class=\"br0\">&#40;</span><span class=\"sy0\">!</span>checkInterrupt<span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />  <br />  <span class=\"co1\">//read the touch state from the MPR121</span><br />  Wire.<span class=\"me1\">requestFrom</span><span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span>2<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <br />  <br />  <span class=\"kw4\">byte</span> LSB <span class=\"sy0\">=</span> Wire.<span class=\"me1\">read</span><span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />  <span class=\"kw4\">byte</span> MSB <span class=\"sy0\">=</span> Wire.<span class=\"me1\">read</span><span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />  <br />  uint16_t touched <span class=\"sy0\">=</span> <span class=\"br0\">&#40;</span><span class=\"br0\">&#40;</span>MSB <span class=\"sy0\">&lt;&lt;</span> 8<span class=\"br0\">&#41;</span> <span class=\"sy0\">|</span> LSB<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <span class=\"co1\">//16bits that make up the touch states</span><br /><br />  <br />  <span class=\"kw1\">for</span> <span class=\"br0\">&#40;</span><span class=\"kw4\">int</span> i<span class=\"sy0\">=</span><span class=\"nu0\">0</span><span class=\"sy0\">;</span> i <span class=\"sy0\">&lt;</span> <span class=\"nu0\">12</span><span class=\"sy0\">;</span> i<span class=\"sy0\">++</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span> <span class=\"co1\">// Check what electrodes were pressed</span><br />   <span class=\"kw1\">if</span><span class=\"br0\">&#40;</span>touched <span class=\"sy0\">&amp;</span> <span class=\"br0\">&#40;</span>1<span class=\"sy0\">&lt;&lt;</span>i<span class=\"br0\">&#41;</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />   <br />    <span class=\"kw1\">if</span><span class=\"br0\">&#40;</span>touchStates<span class=\"br0\">&#91;</span>i<span class=\"br0\">&#93;</span> <span class=\"sy0\">==</span> <span class=\"nu0\">0</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />     <span class=\"co1\">//pin i was just touched</span><br />     <a href=\"geshi/redirect.php?language=arduino&search=Serial\"><span class=\"kw3\">Serial</span></a>.<span class=\"me1\">print</span><span class=\"br0\">&#40;</span><span class=\"st0\">&quot;pin &quot;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />     <a href=\"geshi/redirect.php?language=arduino&search=Serial\"><span class=\"kw3\">Serial</span></a>.<span class=\"me1\">print</span><span class=\"br0\">&#40;</span>i<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />     <a href=\"geshi/redirect.php?language=arduino&search=Serial\"><span class=\"kw3\">Serial</span></a>.<span class=\"me1\">println</span><span class=\"br0\">&#40;</span><span class=\"st0\">&quot; was just touched&quot;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />    <br />    <span class=\"br0\">&#125;</span><span class=\"kw1\">else</span> <span class=\"kw1\">if</span><span class=\"br0\">&#40;</span>touchStates<span class=\"br0\">&#91;</span>i<span class=\"br0\">&#93;</span> <span class=\"sy0\">==</span> <span class=\"nu0\">1</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />     <span class=\"co1\">//pin i is still being touched</span><br />    <span class=\"br0\">&#125;</span> <br />   <br />    touchStates<span class=\"br0\">&#91;</span>i<span class=\"br0\">&#93;</span> <span class=\"sy0\">=</span> <span class=\"nu0\">1</span><span class=\"sy0\">;</span>   <br />   <span class=\"br0\">&#125;</span><span class=\"kw1\">else</span><span class=\"br0\">&#123;</span><br />    <span class=\"kw1\">if</span><span class=\"br0\">&#40;</span>touchStates<span class=\"br0\">&#91;</span>i<span class=\"br0\">&#93;</span> <span class=\"sy0\">==</span> 1<span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />     <a href=\"geshi/redirect.php?language=arduino&search=Serial\"><span class=\"kw3\">Serial</span></a>.<span class=\"me1\">print</span><span class=\"br0\">&#40;</span><span class=\"st0\">&quot;pin &quot;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />     <a href=\"geshi/redirect.php?language=arduino&search=Serial\"><span class=\"kw3\">Serial</span></a>.<span class=\"me1\">print</span><span class=\"br0\">&#40;</span>i<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />     <a href=\"geshi/redirect.php?language=arduino&search=Serial\"><span class=\"kw3\">Serial</span></a>.<span class=\"me1\">println</span><span class=\"br0\">&#40;</span><span class=\"st0\">&quot; is no longer being touched&quot;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />     <br />     <span class=\"co1\">//pin i is no longer being touched</span><br />   <span class=\"br0\">&#125;</span><br />    <br />    touchStates<span class=\"br0\">&#91;</span>i<span class=\"br0\">&#93;</span> <span class=\"sy0\">=</span> <span class=\"nu0\">0</span><span class=\"sy0\">;</span><br />   <span class=\"br0\">&#125;</span><br />  <br />  <span class=\"br0\">&#125;</span><br />  <br /> <span class=\"br0\">&#125;</span><br /><span class=\"br0\">&#125;</span><br /><br /><br /><br /><br /><span class=\"kw4\">void</span> mpr121_setup<span class=\"br0\">&#40;</span><span class=\"kw4\">void</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br /><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE_CFG<span class=\"sy0\">,</span> 0x00<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <br /> <br /> <span class=\"co1\">// Section A - Controls filtering when data is &gt; baseline.</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> MHD_R<span class=\"sy0\">,</span> 0x01<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> NHD_R<span class=\"sy0\">,</span> 0x01<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> NCL_R<span class=\"sy0\">,</span> 0x00<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> FDL_R<span class=\"sy0\">,</span> 0x00<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /><br /> <span class=\"co1\">// Section B - Controls filtering when data is &lt; baseline.</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> MHD_F<span class=\"sy0\">,</span> 0x01<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> NHD_F<span class=\"sy0\">,</span> 0x01<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> NCL_F<span class=\"sy0\">,</span> 0xFF<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> FDL_F<span class=\"sy0\">,</span> 0x02<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> <span class=\"co1\">// Section C - Sets touch and release thresholds for each electrode</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE0_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE0_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE1_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE1_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE2_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE2_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE3_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE3_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE4_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE4_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE5_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE5_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE6_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE6_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE7_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE7_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE8_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE8_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE9_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE9_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE10_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE10_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE11_T<span class=\"sy0\">,</span> TOU_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE11_R<span class=\"sy0\">,</span> REL_THRESH<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> <span class=\"co1\">// Section D</span><br /> <span class=\"co1\">// Set the Filter Configuration</span><br /> <span class=\"co1\">// Set ESI2</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> FIL_CFG<span class=\"sy0\">,</span> 0x04<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /> <span class=\"co1\">// Section E</span><br /> <span class=\"co1\">// Electrode Configuration</span><br /> <span class=\"co1\">// Set ELE_CFG to 0x00 to return to standby mode</span><br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE_CFG<span class=\"sy0\">,</span> 0x0C<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span> <span class=\"co1\">// Enables all 12 Electrodes</span><br /> <br /> <br /> <span class=\"co1\">// Section F</span><br /> <span class=\"co1\">// Enable Auto Config and auto Reconfig</span><br /> <span class=\"coMULTI\">/*set_register(0x5A, ATO_CFG0, 0x0B);<br /> set_register(0x5A, ATO_CFGU, 0xC9); // USL = (Vdd-0.7)/vdd*256 = 0xC9 @3.3V  set_register(0x5A, ATO_CFGL, 0x82); // LSL = 0.65*USL = 0x82 @3.3V<br /> set_register(0x5A, ATO_CFGT, 0xB5);*/</span> <span class=\"co1\">// Target = 0.9*USL = 0xB5 @3.3V</span><br /> <br /> set_register<span class=\"br0\">&#40;</span>0x5A<span class=\"sy0\">,</span> ELE_CFG<span class=\"sy0\">,</span> 0x0C<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /> <br /><span class=\"br0\">&#125;</span><br /><br /><br /><span class=\"kw4\">boolean</span> checkInterrupt<span class=\"br0\">&#40;</span><span class=\"kw4\">void</span><span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br /> <span class=\"kw1\">return</span> <a href=\"geshi/redirect.php?language=arduino&search=digitalRead\"><span class=\"kw3\">digitalRead</span></a><span class=\"br0\">&#40;</span>irqpin<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /><span class=\"br0\">&#125;</span><br /><br /><br /><span class=\"kw4\">void</span> set_register<span class=\"br0\">&#40;</span><span class=\"kw4\">int</span> address<span class=\"sy0\">,</span> <span class=\"kw4\">unsigned</span> <span class=\"kw4\">char</span> r<span class=\"sy0\">,</span> <span class=\"kw4\">unsigned</span> <span class=\"kw4\">char</span> v<span class=\"br0\">&#41;</span><span class=\"br0\">&#123;</span><br />  Wire.<span class=\"me1\">beginTransmission</span><span class=\"br0\">&#40;</span>address<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />  Wire.<span class=\"me1\">write</span><span class=\"br0\">&#40;</span>r<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />  Wire.<span class=\"me1\">write</span><span class=\"br0\">&#40;</span>v<span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br />  Wire.<span class=\"me1\">endTransmission</span><span class=\"br0\">&#40;</span><span class=\"br0\">&#41;</span><span class=\"sy0\">;</span><br /><span class=\"br0\">&#125;</span></code></pre>  </div>  </div>  </div>    </div></div><div class=\"footer\">powered by <a title=\"github.com\" href=\"http://github.com\">github</a><!-- Served in 0.0060708522796631 sec - loaded from cache: yes - limitLeft:  of  --!></div></div>');
new Embed("MPR121_sidebar", "MPR121_code", {"sha":"0df2b47373a02af51ab01deab112330538c53284","url":"https:\/\/api.github.com\/repos\/ameyer\/MPR121\/git\/trees\/0df2b47373a02af51ab01deab112330538c53284","tree":[{"path":"License.txt","mode":"100755","type":"blob","sha":"b132efea8543fe82d1fd16a19298a9840f395e17","size":1073,"url":"https:\/\/api.github.com\/repos\/ameyer\/MPR121\/git\/blobs\/b132efea8543fe82d1fd16a19298a9840f395e17"},{"path":"README.md","mode":"100644","type":"blob","sha":"109964718325fa3a3d9f8946cc1514193ce601e8","size":327,"url":"https:\/\/api.github.com\/repos\/ameyer\/MPR121\/git\/blobs\/109964718325fa3a3d9f8946cc1514193ce601e8"},{"path":"mpr121\/mpr121.h","mode":"100755","type":"blob","sha":"bb88a2beaf385f3f9fe35d7d56f2e610934fff33","size":1102,"url":"https:\/\/api.github.com\/repos\/ameyer\/MPR121\/git\/blobs\/bb88a2beaf385f3f9fe35d7d56f2e610934fff33"},{"path":"mpr121\/mpr121.ino","mode":"100755","type":"blob","sha":"4db6a572f333dbbbeef090046679265055be8bb5","size":3800,"url":"https:\/\/api.github.com\/repos\/ameyer\/MPR121\/git\/blobs\/4db6a572f333dbbbeef090046679265055be8bb5"}],"truncated":false})

<!-- Served in 0.0063068866729736 sec - loaded from cache: yes - limitLeft:  of  --!>