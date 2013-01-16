;(function  () {

	var JCT = function (selecter){
		return new JCT.prototype.init(selecter);
	};
	JCT.prototype = {

		constructor : JCT,

		init : function (selecter){
			var ret;
			if (typeof selecter == 'string') {

				ret = this.toArray(document.querySelectorAll(selecter));

			//原生dom数组:$([DOMEle,DOMEle,...]) 
			}else if(
				this.type(selecter) == "undefined"
				||
				!("length" in selecter && "nodeType" in selecter[0])
				||
				!("nodeType" in selecter)
				||
				!(selecter instanceof JCT)
			){

				return null;

			};

			return this.makeArray(ret , this);
		},

		length : 0,

		makeArray : function(arr, ctx){
			var ret = ctx || [];

			for (var i = 0; i < arr.length; i++) {
				ret[i]=arr[i]
			};
			ret.length = arr.length;

			return ret;
		},
		toArray : function(likeArr){
			return Array.prototype.slice.call(likeArr);
		}
	}

	JCT.prototype.init.prototype = JCT.fn = JCT.prototype;

	JCT.type = JCT.fn.type = function (data){
		return Object.prototype.toString.call(data).replace(/\[object\s|\]/gi,"").toLowerCase();
	}

	// 简单继承：
	// 参数[deepcopy],target,options
	// 是否深度复制，目标对象/数组，待被拷贝的对象/数组
	JCT.extend = JCT.fn.extend = function(){
		if (arguments.length <=0) { return ;};
		var target = arguments[0],
			deep = false,
			options = arguments[1] || {};

		if (typeof target == 'boolean') {
			deep = target;
			target = arguments[1];
			options = arguments[2] || {};
		}

		// 如果第二个参数不正确，则根据options创建对应类型的target复制
		if (!arguments[1]) {
			switch (JCT.type(options)){
				case "array":
					target = [];
					break;
				case "object":
					target = {};
					break;
				default:
					return options;
			}
		};


		// 浅复制
		if (!deep) {
			for(var i in options){
				target[i] = options[i];
			}
		}else{
			//深度复制
			for(var i in options){
				// array or object
				if (JCT.type(options[i]) == "array" || JCT.type(options[i]) == "object") {
					target[i] = JCT.extend(deep, null, options[i]);
				}else{
					target[i] = options[i];
				}
			}
		}

		return target;
	}

	JCT.fn.each = function(callback, ctx){
		ctx = ctx || this;
		for (var i = 0; i < this.length; i++) {
			callback.call(ctx, this[i], i, this);
		};
	}

	//css supported pre


	var profix = function(proname) {
		// float fix
		if (proname.toLowerCase() == "float") {
			proname = ("cssFloat" in document.body.style) ? "cssFloat" : "styleFloat";
			return proname;
		};

		// 不包含-写法的直接退出
		if (proname.indexOf("-") == -1) {
			return proname;
		};
		var arr = proname.split("-");
		arr.forEach(function(key,ind){
			arr[ind] = key.charAt(0).toUpperCase() + key.substr(1);
		});
		arr = arr.join("");
		arr = arr.charAt(0).toLowerCase() + arr.substr(1);

		return arr;
	}

	var prefix = function(style) {

		var tests = ["","o","O","MS","ms","webkit","moz","MOZ","Moz","WebKit","Webkit"];
		var style1 = style.charAt(0).toUpperCase() + style.substr(1);//第一字母大写
		style = style.charAt(0).toLowerCase() + style.substr(1);//第一字母小写

		var pre = ""
		for (var i = 0; i < tests.length; i++) {
			pre = tests[i] + style;
			if (pre in document.body.style) {
				return pre;
			};
			pre = tests[i] + style1;
			if (pre in document.body.style) {
				return pre;
			};
		};

		return "";
	};


	JCT.supported = JCT.fn.supported = (function(){
		var preList = ["transform","transition","transitionDuration"];
		var ret = {};

		for (var i = 0; i < preList.length; i++) {
			ret[preList[i]] = prefix(preList[i]);
		};

		return ret;
	})();

	window.JCT = JCT

	// 设置css动画持续时间
	JCT.fn.transitionTime = JCT.fn.transitionDuration = function(time) {

		var proname = JCT.supported.transitionDuration;

		return (arguments.length > 0 ) ? this.style(proname, time) : this.style(proname);
	};

	// 通用的style方法，设置或获取
	JCT.fn.style = function(proname, value) {
		proname = prefix(profix(proname));

		if (arguments.length>1) {

			this.each(function(key,index,arr){console.log(arr)
				arr[index].style[proname] = value;
			});

			return this;
		};

		var cstyle = this.length && getComputedStyle(this[0], null);

		return (cstyle.length) ? cstyle[proname] : this[0].style[proname];
	};
	// 设置css transform
	JCT.fn.transform = function(value) {
		var proname = JCT.supported.transform;

		return (arguments.length > 0 ) ? this.style(proname, value) : this.style(proname);
	};

	// 清除transfrom设置
	JCT.fn.clearTransform = function() {
		return this.style(JCT.supported.transform , "");
	};

	var _transPros = {
		//"rotate" : "rotateZ/-1",
		"rotateZ" : "rotate/0",
		"skewX" : "skew/0",
		"skewY" : "skew/1",
		"scaleX" : "scale/0",
		"scaleY" : "scale/1",
		"translateX" : "translate/0//translate3d/0",
		"translateY" : "translate/1//translate3d/1",
		"translateZ" : "translate3d/2"
	};

	// 设置单个dom的pro
	function __setTransformPro (key,value, dom){
		key = key.split("/");
		var fixInd = key.length > 1 ? key[1] : -2;
		key = key[0];
		
		var style = dom.style[prefix('transform')];
		var hasKey = style.indexOf(key);
		if (hasKey != -1) {
			// key 存在，直接替换,存在多个只替换第一个

			// 需要设置合写
			if (fixInd != -2) {
				// [30deg,10deg]
				var avals = style.match(new RegExp(key+"\\([^\\)]*\\)"))[0].replace(new RegExp(key+"\\(|\\)","gi"),"").split(",");
				
				(avals.length>fixInd) ? (avals[fixInd] = value) : avals.splice(fixInd,0,value);

				avals = avals.join(","); // =>"30deg,10deg"
			}
		
			style = style.replace(new RegExp(key+"\\([^\\)]*\\)"), key+"("+( avals ? avals :value)+")");
			dom.style[prefix('transform')] = style;

		}else{
			// 不存在，检查是否有合写属性已经设置
			// [translate/0,translate3d/0]
			if (_transPros[key]) {
				var rkeys = _transPros[key].split("//"); 
				for (var ii = 0; ii < rkeys.length; ii++) {
					if (__setTransformPro(rkeys[ii], value, dom)) {						
						break;
					};
				};
			}else{
				//如果key不存在，也没合写属性，则在后面追加
				style += " " + key + "(" + value + ")";
				dom.style[prefix('transform')] = style;
			};
				
		}
		
		return hasKey;

	}

	// key 支持scale也支持scale/0的写法
	// 返回key是否在style中直接存在,
	// scaleX:1,如果style为scale(1,1),则scaleX不是直接存在style中
	// 如果style 为scaleX(1),泽scaleX是直接存在
	function _setTransformPro (key,value, ctx){
		key = key.split("/");
		var fixInd = key.length > 1 ? key[1] : -2;
		key = key[0];
		var style = null;
		ctx.each(function(k, i ){
			__setTransformPro(key, value, k);
		});

		return ctx;

	}
	// 得到rotate值,如无，则默认返回Z轴，如都无，返回0
	// value => number  设置rotateZ的角度值，
	JCT.fn.rotate = function(value){
		
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("rotateZ", (!isNaN(value-0)) ? value + 'deg' : value, this);

			return this;
		};

		// getter		
		return this.getTransformState("rotateZ");

	}

	JCT.fn.rotateX = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("rotateX", (!isNaN(value-0)) ? value + 'deg' : value, this);
			return this;
		};

		// getter		
		return this.getTransformState("rotateX");
	}

	JCT.fn.rotateY = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("rotateY", (!isNaN(value-0)) ? value + 'deg' : value, this);
			return this;
		};
		
		// getter		
		return this.getTransformState("rotateY");
	}

	JCT.fn.rotateZ = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("rotateZ", (!isNaN(value-0)) ? value + 'deg' : value, this);
			return this;
		};
		
		// getter		
		return this.getTransformState("rotateZ");
	}

	JCT.fn.translateX = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("translateX", (!isNaN(value-0) && (value+"").indexOf('%')==-1) ? value + 'px' : value, this);
			return this;
		};

		// getter		
		return this.getTransformState("translateX");
	}

	JCT.fn.translateY = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("translateY", (!isNaN(value-0) && (value+"").indexOf('%')==-1) ? value + 'px' : value, this);
			return this;
		};

		// getter		
		return this.getTransformState("translateY");
	}

	JCT.fn.translateZ = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("translateZ", (!isNaN(value-0) && (value+"").indexOf('%')==-1) ? value + 'px' : value, this);
			return this;
		};

		// getter		
		return this.getTransformState("translateZ");
	}

	JCT.fn.translate = function(x, y){
		if (arguments.length == 2) {
			return this.translateX(x).translateY(y);	
		};
		if (arguments.length == 1) {
			if ((x+="").indexOf(",")) {
				y = x.split(",")
				x = y[0]
				y = y[1]
				return this.translateX(x).translateY(y);
			}else{
				return this.translateX(x);
			}
			
		};

		// getter		
		return this.getTransformState("translate");
	}

	//没找到的属性，去找相关属性
	JCT.fn._getFixTransformState = function(proname){
		var tmpp = null;
		switch (proname){
			// rotateZ取不到，则取rotate,
			case "rotateZ":
				tmpp =  this.getTransformState("rotate");
				break;

			// skewX取不到，则取skew的第一个
			case "skewX" :
				if (tmpp = this.getTransformState("skew")) {
					tmpp = tmpp.split(",");
					tmpp = tmpp.length>0 ? tmpp[0] : 0;
				};
				break;
			case "skewY" :
				if (tmpp = this.getTransformState("skew")) {
					tmpp = tmpp.split(",");
					tmpp = tmpp.length>1 ? tmpp[1] : 0;
				};
				break;
			case "skewZ" :
				if (tmpp = this.getTransformState("skew")) {
					tmpp = tmpp.split(",");
					tmpp = tmpp.length>2 ? tmpp[2] : 0;
				};
				break;
			case "translateX" :
				if (tmpp = this.getTransformState("translate")) {
					tmpp = tmpp.split(",");
					tmpp = tmpp.length>0 ? tmpp[0] : 0;
				};
				
				break;
			case "translateY" :
				if (tmpp = this.getTransformState("translate")) {
					tmpp = tmpp.split(",");
					tmpp = tmpp.length>1 ? tmpp[1] : 0;
				};
				
				break;
			case "scaleX" :
				if (tmpp = this.getTransformState("scale")) {
					tmpp = tmpp.split(",");
					tmpp = tmpp.length>0 ? tmpp[0] : 0;
				};
				
				break;
			case "scaleY" :
				if (tmpp = this.getTransformState("scale")) {
					tmpp = tmpp.split(",");
					tmpp = tmpp.length>1 ? tmpp[1] : tmpp.length>0 ? tmpp[0] : 0;
				};
				
				break;

		}
		return typeof tmpp == "string" ? tmpp.trim() : tmpp;
	}

	// 不支持相同属性重复出现的写法，以scale为例，scale只能在transform中出现一次，并且只取第一次。
	// 返回值有三种
	// 0:相关属性被设置为0（包括默认设置）
	// null:相关属性没有被书写
	// string：相关属性被设置成的值
	JCT.fn.getTransformState = function(proname){
		
		// 只能支持从标签.style中获取，getComputedStyle获取到的是矩阵，无法倒推出角度。
		if (this.length ==0) {return 0};

		var text = this[0].style[JCT.supported.transform];

		var reg1 = new RegExp(proname+'\\([^\\)]*\\)','gi');
		var arr = text.match(reg1);

		if (arr == null || arr.length <= 0) {
			return this._getFixTransformState(proname);
		}else{
			var temp = 0;
			var tmp = false;
			arr.forEach(function(key,i){
				arr[i] = arr[i].trim();
				var pre = arr[i].substring(0,proname.length+1);
				// 存在多个rotate(),最前一个生效
				if (pre == proname+"(" && !tmp) {
					var reg2 = new RegExp(proname+"\\(|\\)","gi");
					temp = arr[i].replace(reg2,"");
					
					tmp = true;
				};
				
			});
			if (!tmp) {
				return this._getFixTransformState(proname);
			}else{
				//过滤逗号?no.
				return temp;
			}
			
		}

	}


	window.$$=function(s){
		return new JCT(s)
	};
	window.a = $$('.con')
	a.style("-webkit-transform","rotate(30deg) rotateX(80deg)  skew(30deg,40deg)translate(300px) translateZ(0px) scale(1.2) scale(1.3,1.1)")
	a.rotateY("40deg");
	function MulPage(dom){

		this._wrapper = (typeof dom == "string") ? document.querySelector(dom) : dom;
		this._con = this._wrapper.querySelector(".con");

		this.init();
	}

	MulPage.prototype.init = function() {
		
		

		// bind event
		var _this = this;
		document.onclick = function (){
			_this.setTransform(_this._con , "translate(300px)");
			_this._con.style[_JCT.supported.transform] = "translate(300px)"
		}
	};

	

	

	//new MulPage("[data-control=mulpage]")
	
})();