(function  () {
	// 一个简单的dom封装器，给dom封装一些css3转换的操作方法.
	function $dom(selecter){

		if (typeof selecter == 'string') {
			this.dom = document.querySelectorAll(selecter);

			// 转换为真正的数组
			this.dom = Array.prototype.slice.call(this.dom);

		//原生dom数组
		}else if("length" in selecter && "nodeType" in selecter[0]){
			this.dom = ("concat" in selecter) ? selecter : Array.prototype.slice.call(selecter);
		}else{
			this.dom = (!!selecter) ?[selecter] : [];
		}

		this.init();

		return this;
	}

	$dom.prototype.init = function() {

		//css supported state
		var temp = {};
		this.styleState = temp;
		temp.transition = this.prefix("transition");
		temp.transitionDuration = this.prefix("transitionDuration");
		temp.transform = this.prefix("transform");

		temp = null;


	};

	$dom.prototype.profix = function(proname) {
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

	$dom.prototype.prefix = function(style) {
		this.prefix.style = (!!this.prefix.style) ? this.prefix.style : document.createElement("div").style ;

		var tests = ["","o","O","MS","ms","webkit","moz","MOZ","Moz","WebKit","Webkit"];
		var style1 = style.charAt(0).toUpperCase() + style.substr(1);//第一字母大写
		style = style.charAt(0).toLowerCase() + style.substr(1);//第一字母小写

		var pre = ""
		for (var i = 0; i < tests.length; i++) {
			pre = tests[i] + style;
			if (pre in this.prefix.style) {
				return pre;
			};
			pre = tests[i] + style1;
			if (pre in this.prefix.style) {
				return pre;
			};
		};

		return "";
	};

	// 设置css动画持续时间
	$dom.prototype.transitionTime = MulPage.prototype.transitionDuration = function(time) {

		var proname = this.styleState.transitionDuration;

		return (arguments.length > 0 ) ? this.style(proname, time) : this.style(proname);
	};

	// 通用的style方法，设置或获取
	$dom.prototype.style = function(proname, value) {
		proname = this.prefix(this.profix(proname));

		if (arguments.length>1) {

			this.dom.forEach(function(key,index,arr){
				arr[index].style[proname] = value;
			});

			return this;
		};

		var cstyle = this.dom.length && getComputedStyle(this.dom[0], null);

		return (cstyle.length) ? cstyle[proname] : this.dom[0].style[proname];
	};
	// 设置css transform
	$dom.prototype.transform = function(value) {
		var proname = this.styleState.transform;

		return (arguments.length > 0 ) ? this.style(proname, value) : this.style(proname);
	};

	// 清除transfrom设置
	$dom.prototype.clearTransform = function() {
		return this.style(this.styleState.transform , "");
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
		ctx.dom.forEach(function(k, i ){
			__setTransformPro(key, value, k);
		});

		return ctx;

	}
	// 得到rotate值,如无，则默认返回Z轴，如都无，返回0
	// value => number  设置rotateZ的角度值，
	$dom.prototype.rotate = function(value){
		
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("rotateZ", (!isNaN(value-0)) ? value + 'deg' : value, this);

			return this;
		};

		// getter		
		return this.getTransformState("rotateZ");

	}

	$dom.prototype.rotateX = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("rotateX", (!isNaN(value-0)) ? value + 'deg' : value, this);
			return this;
		};

		// getter		
		return this.getTransformState("rotateX");
	}

	$dom.prototype.rotateY = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("rotateY", (!isNaN(value-0)) ? value + 'deg' : value, this);
			return this;
		};
		
		// getter		
		return this.getTransformState("rotateY");
	}

	$dom.prototype.rotateZ = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("rotateZ", (!isNaN(value-0)) ? value + 'deg' : value, this);
			return this;
		};
		
		// getter		
		return this.getTransformState("rotateZ");
	}

	$dom.prototype.translateX = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("translateX", (!isNaN(value-0) && (value+"").indexOf('%')==-1) ? value + 'px' : value, this);
			return this;
		};

		// getter		
		return this.getTransformState("translateX");
	}

	$dom.prototype.translateY = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("translateY", (!isNaN(value-0) && (value+"").indexOf('%')==-1) ? value + 'px' : value, this);
			return this;
		};

		// getter		
		return this.getTransformState("translateY");
	}

	$dom.prototype.translateZ = function(value){
		if (arguments.length >= 1) {
			//setter
			_setTransformPro("translateZ", (!isNaN(value-0) && (value+"").indexOf('%')==-1) ? value + 'px' : value, this);
			return this;
		};

		// getter		
		return this.getTransformState("translateZ");
	}

	$dom.prototype.translate = function(x, y){
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
	$dom.prototype._getFixTransformState = function(proname){
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
	$dom.prototype.getTransformState = function(proname){
		
		// 只能支持从标签.style中获取，getComputedStyle获取到的是矩阵，无法倒推出角度。
		if (this.dom.length ==0) {return 0};

		var text = this.dom[0].style[this.styleState.transform];

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
		return new $dom(s)
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
			_this._con.style[_this.styleState.transform] = "translate(300px)"
		}
	};

	

	

	//new MulPage("[data-control=mulpage]")
	
})();