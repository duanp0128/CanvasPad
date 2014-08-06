//画布
var canvas ;
var context ;
//蒙版
var canvas_bak;
var context_bak;

var canvasWidth = 960;
var canvasHeight = 580;

var canvasTop;
var canvasLeft;

//recognition attribute
var points;
var dr;

var isText = false;

//画笔大小
var size = 1;
var color  = '#000000';

//画图形
var draw_graph = function(graphType,obj){	

	//把蒙版放于画板上面
	$("#canvas_bak").css("z-index",1);
	//先画在蒙版上 再复制到画布上
		
	chooseImg(obj);			
	var canDraw = false;	
	
	var startX;
	var startY;

    points = new Array();
    dr = new DollarRecognizer();

	//鼠标按下获取 开始xy开始画图
	var mousedown = function(e){
		scroolTop = $(window).scrollTop();
		scroolLeft = $(window).scrollLeft();
		canvasTop = $(canvas).offset().top - scroolTop;
		canvasLeft = $(canvas).offset().left - scroolLeft;

		context.strokeStyle= color;
		context_bak.strokeStyle= color;
		context_bak.lineWidth = size;
		
		startX = e.clientX - canvasLeft;
		startY = e.clientY - canvasTop;
		context_bak.moveTo(startX ,startY );
		canDraw = true;

        //record points
        points.length = 1; // clear
        points[0] = new Point(startX, startY);

        if(graphType == 'pencil'){
			context_bak.beginPath();
		}else if(graphType == 'circle'){
			context.beginPath();
			context.moveTo(startX ,startY );
			context.lineTo(startX +1 ,startY+1);
			context.stroke();	
			
		}else if(graphType == 'rubber'){							
			context.clearRect(startX - size * 10 ,  startY - size * 10 , size * 20 , size * 20);				
		}else if(graphType == 'handwriting') {
            if ($("text-input").is(":visible"))
                return;
            showTextInput(e.pageX, e.pageY);
            setValue(startX, startY);
//            console.log(startX, startY);
            
            canDraw = false;
        }

		// 阻止点击时的cursor的变化，draw
		e=e||window.event;
		e.preventDefault();
	};	

	//鼠标离开 把蒙版canvas的图片生成到canvas中
	var mouseup = function(e){
		e=e||window.event;
		canDraw = false;

        var result = dr.Recognize(points, true);
//        console.log(result.Name);
//        console.log(points);

        //begin of the arrow
        var beginX = points[0].X;
        var beginY = points[0].Y;
        //arrow point
        var headX = points[points.length-1].X;
        var headY = points[points.length-1].Y;
        var endX, endY;

        //sort points
        points.sort(myCompareX);
        var x1 = points[0].X;
        var x2 = points[points.length-1].X;
//        //the most x in arrow
//        var txx = points[0];
//        var txy = points[points.length-1];

        points.sort(myCompareY);
        var y1 = points[0].Y;
        var y2 = points[points.length-1].Y;
        //the most y in arrow
        var ty1 = points[0];
        var ty2 = points[points.length-1];

        //redraw figures
        if (result.Name == "line") {
            context_bak.beginPath();
            clearContext();
            context_bak.moveTo(points[0].X, points[0].Y);
            context_bak.lineTo(points[points.length-1].X, points[points.length-1].Y);
            context_bak.stroke();
        }else if (result.Name == "circle") {
            var rx = (x1 + x2) * 0.5;
            var ry = (y1 + y2) * 0.5;
            var rr = (x2-x1)>(y2-y1)?(x2-x1):(y2-y1);

            context_bak.beginPath();
            clearContext();
            context_bak.arc(rx,ry,rr*0.5,0,Math.PI * 2,false);
            context_bak.stroke();
        }else if (result.Name == "diamond") {
            var midX = (x2 + x1) * 0.5;
            var midY = (y2 + y1) * 0.5;

            context_bak.beginPath();
            clearContext();
            context_bak.moveTo(x1, midY);
            context_bak.lineTo(midX, y2);
            context_bak.lineTo(x2, midY);
            context_bak.lineTo(midX, y1);
            context_bak.lineTo(x1, midY);
            context_bak.stroke();
        }else if (result.Name == "rectangle") {
            var w = x2 - x1;
            var h = y2 - y1;

            context_bak.beginPath();
            clearContext();
            context_bak.rect(x1, y1, w, h);
            context_bak.stroke();
        }else if (result.Name == "arrow") {
            if (ty1.X == beginX && ty1.Y == beginY) {
                endX = ty2.X;
                endY = ty2.Y;
            }else {
                endX = ty1.X;
                endY = ty1.Y;
            }

            var len = Math.sqrt((headX-endX)*(headX-endX)+(headY-endY)*(headY-endY));
////            var angle = ;
//
            clearContext();
            drawArrow(context_bak, beginX, beginY, endX, endY, 2, 1, Math.PI/8, len*0.6);
        }else if (result.Name == "ellipse") {
            var ew = x2 - x1;
            var eh = y2 - y1;
            var ex = (x1 + x2) * 0.5;
            var ey = (y1 + y2) * 0.5;

            context_bak.beginPath();
            clearContext();
            drawEllipseByCenter(context_bak, ex, ey, ew, eh);
        }

        var image = new Image();
		if(graphType!='rubber'){		
			image.src = canvas_bak.toDataURL();
			image.onload = function(){
				context.drawImage(image , 0 ,0 , image.width , image.height , 0 ,0 , canvasWidth , canvasHeight);
				clearContext();
				saveImageToAry();
			}
		}
	};

    //sort points by x
    function myCompareX(a, b) {
        if (a.X != b.X) {
            return a.X - b.X;
        }else {
            return a.Y - b.Y;
        }
    }

    //sort points by y
    function myCompareY(a, b) {
        if (a.Y != b.Y) {
            return a.Y - b.Y;
        }else {
            return a.X - b.X;
        }
    }

    //draw ellipse
    function drawEllipseByCenter(ctx, cx, cy, w, h) {
        drawEllipse(ctx, cx - w/2.0, cy - h/2.0, w, h);
    }

    function drawEllipse(ctx, x, y, w, h) {
        var kappa = .5522848,
            ox = (w / 2) * kappa, // control point offset horizontal
            oy = (h / 2) * kappa, // control point offset vertical
            xe = x + w,           // x-end
            ye = y + h,           // y-end
            xm = x + w / 2,       // x-middle
            ym = y + h / 2;       // y-middle

        ctx.beginPath();
        ctx.moveTo(x, ym);
        ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
        ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
        ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
        ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
        ctx.stroke();
    }

    //draw arrow
    var drawHead=function(ctx,x0,y0,x1,y1,x2,y2,style)
    {
        var radius=3;
        var twoPI=2*Math.PI;

        // all cases do this.
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x0,y0);
        ctx.lineTo(x1,y1);
        ctx.lineTo(x2,y2);
        // unfilled head, just stroke

        ctx.stroke();
        ctx.restore();
    };

    var drawArrow=function(ctx,x1,y1,x2,y2,style,which,angle,d)
    {
        style=typeof(style)!='undefined'? style:3;
        which=typeof(which)!='undefined'? which:1; // end point gets arrow
        angle=typeof(angle)!='undefined'? angle:Math.PI/8;
        d    =typeof(d)    !='undefined'? d    :10;
        // default to using drawHead to draw the head, but if the style
        // argument is a function, use it instead
        var toDrawHead=typeof(style)!='function'?drawHead:style;

        // For ends with arrow we actually want to stop before we get to the arrow
        // so that wide lines won't put a flat end on the arrow.
        //
        var dist=Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
        var ratio=(dist-d/3)/dist;
        var tox, toy,fromx,fromy;

        tox=Math.round(x1+(x2-x1)*ratio);
        toy=Math.round(y1+(y2-y1)*ratio);

        // Draw the shaft of the arrow
        ctx.beginPath();
//        ctx.moveTo(fromx,fromy);
//        ctx.lineTo(tox,toy);
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);

        ctx.stroke();

        // calculate the angle of the line
        var lineangle=Math.atan2(y2-y1,x2-x1);
        // h is the line length of a side of the arrow head
        var h=Math.abs(d/Math.cos(angle));

        if(which&1){	// handle far end arrow head
            var angle1=lineangle+Math.PI+angle;
            var topx=x2+Math.cos(angle1)*h;
            var topy=y2+Math.sin(angle1)*h;
            var angle2=lineangle+Math.PI-angle;
            var botx=x2+Math.cos(angle2)*h;
            var boty=y2+Math.sin(angle2)*h;
            toDrawHead(ctx,topx,topy,x2,y2,botx,boty,style);
        }
    }

    //draw text
    function showTextInput(x, y)
    {
        $("#text-input").css("top", y)
            .css("left", x)
            .fadeIn("fast");
        $("#text-input input").val("").focus();
    }

	//选择功能按钮 修改样式
	function chooseImg(obj){
		var imgAry  = $(".draw_controller li");
		for(var i=0;i<imgAry.length;i++){
			$(imgAry[i]).removeClass('active');
			$(imgAry[i]).addClass('normal');				
		}
		$(obj).removeClass("normal");
		$(obj).addClass("active");
	}

	// 鼠标移动
	var  mousemove = function(e){
		scroolTop = $(window).scrollTop();
		scroolLeft = $(window).scrollLeft();
		canvasTop = $(canvas).offset().top - scroolTop;
		canvasLeft = $(canvas).offset().left - scroolLeft;
		e=e||window.event;
		var x = e.clientX   - canvasLeft;
		var y = e.clientY  - canvasTop;	
		//方块  4条直线搞定
		if(graphType == 'square'){
			if(canDraw){
				context_bak.beginPath();
				clearContext();
				context_bak.moveTo(startX , startY);						
				context_bak.lineTo(x  ,startY );
				context_bak.lineTo(x  ,y );
				context_bak.lineTo(startX  ,y );
				context_bak.lineTo(startX  ,startY );
				context_bak.stroke();
			}
		//直线
		}else if(graphType =='line'){						
			if(canDraw){
				context_bak.beginPath();
				clearContext();
				context_bak.moveTo(startX , startY);
				context_bak.lineTo(x  ,y );
				context_bak.stroke();
			}
		//画笔
		}else if(graphType == 'pencil'){
			if(canDraw){
                points[points.length] = new Point(x, y); // append
				context_bak.lineTo(e.clientX   - canvasLeft ,e.clientY  - canvasTop);
				context_bak.stroke();						
			}
		//圆 未画得时候 出现一个小圆
		}else if(graphType == 'circle'){						
			clearContext();
			if(canDraw){
				// 鼠标点击移动时产生的圆
				context_bak.beginPath();			
				var radii = Math.sqrt((startX - x) *  (startX - x)  + (startY - y) * (startY - y));
				context_bak.arc(startX,startY,radii,0,Math.PI * 2,false);									
				context_bak.stroke();
			}else{	
				context_bak.beginPath();					
				context_bak.arc(x,y,20,0,Math.PI * 2,false);
				context_bak.stroke();
			}
//		//涂鸦 未画得时候 出现一个小圆
//		}else if(graphType == 'handwriting'){
//			if(canDraw){
//                isText = true;
//
//			}else{
//                isText = true;
//			}
		//橡皮擦 不管有没有在画都出现小方块 按下鼠标 开始清空区域
		}else if(graphType == 'rubber'){	
			context_bak.lineWidth = 1;
			clearContext();
			context_bak.beginPath();			
			context_bak.strokeStyle =  '#000000';						
			context_bak.moveTo(x - size * 10 ,  y - size * 10 );						
			context_bak.lineTo(x + size * 10  , y - size * 10 );
			context_bak.lineTo(x + size * 10  , y + size * 10 );
			context_bak.lineTo(x - size * 10  , y + size * 10 );
			context_bak.lineTo(x - size * 10  , y - size * 10 );	
			context_bak.stroke();		
			if(canDraw){							
				context.clearRect(x - size * 10 ,  y - size * 10 , size * 20 , size * 20);
										
			}			
		}
	};


	//鼠标离开区域以外 除了涂鸦 都清空
	var mouseout = function(){
		if(graphType != 'handwriting'){
			clearContext();
		}
	}

	$(canvas_bak).unbind();
	$(canvas_bak).bind('mousedown',mousedown);
	$(canvas_bak).bind('mousemove',mousemove);
	$(canvas_bak).bind('mouseup',mouseup);
	$(canvas_bak).bind('mouseout',mouseout);
}

//清空层
var clearContext = function(type){
	if(!type){
		context_bak.clearRect(0,0,canvasWidth,canvasHeight);
	}else{
		context.clearRect(0,0,canvasWidth,canvasHeight);
		context_bak.clearRect(0,0,canvasWidth,canvasHeight);
	}
}

