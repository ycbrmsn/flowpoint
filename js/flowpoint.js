/**
 * 流程点顺序闪烁
 * @auto jzw
 * @version 1.0.1
 * 2018-05-10 v1.0.1 增加缩放功能，以解决字体不清晰的问题
 */
var ycbrmsn = ycbrmsn || {};
ycbrmsn.getFlowPoint = (function () {
  var MyPoint = function (x, y) {
    this.x = x;
    this.y = y;
  }
  var FlowPoint = function (options) {
    this.radius = 16; // 圆半径
    this.enlargeRatio = 1.7; // 放大比例
    this.reduceRatio = 0.7; // 缩小比例
    this.minRadius = this.radius * this.reduceRatio; // 圆半径最小值
    this.maxRadius = this.radius * this.enlargeRatio; // 圆半径最大值
    this.imgWidth = 32; // 图标宽度
    this.minImgWidth = this.imgWidth * this.reduceRatio; // 图标最小宽度
    this.maxImgWidth = this.imgWidth * this.enlargeRatio; // 图标最大宽度
    this.bgColor = '#565253'; // 圆背景颜色
    this.hoverBgColor = '#ffe401'; // 移入圆背景颜色，目前暂未使用
    this.lineGap = this.radius + 10; // 连接线距离圆心的距离
    this.opacity = 0.7; // 圆的透明度
    this.period = 2000; // 闪动圆时间间隔
    this.color = '#fff'; // 字体颜色
    this.fontSize = 16; // 字体大小
    this.fontWeight = 'normal';
    this.fontFamily = '微软雅黑';
    this.fontGap = 5; // 字与圆圈的间距
    this.align = 'bottom'; // 字相对圆圈的位置
    this.changeStep = 1; // 变化步长
    this.lineColor = '#fff';
    this.lineWidth = 1;
    this.ratio = 1; // canvas放大比例

    for (var i in options) {
      this[i] = options[i];
    }

    this.canvas = document.getElementById(this.id);
    this.ctx = this.canvas.getContext('2d');
    this.cacheCanvas = document.createElement('canvas');
    this.cacheCanvas.width = this.canvas.width;
    this.cacheCanvas.height = this.canvas.height;
    this.cacheCtx = this.cacheCanvas.getContext('2d');
    this.circles = []; // 所有圆圈的集合，hover时使用，目前未使用
    this.hoverIndex = null; // 移入时的圆圈序数，目前未使用
    this.radiusChange = 1; // 圆圈变化单位
    this.imgWidthChangeRatio = this.imgWidth / 2 / this.radius;
    this.images = {}; // 保存所有图标的映射
    this.isVisible = true; // 当前是否可见，用于避免切换标签回来后休眠动画同时响应的问题

    // 放大
    var ratioArr = ['radius', 'minRadius', 'maxRadius', 'imgWidth', 'minImgWidth', 'maxImgWidth', 
      'lineGap', 'fontSize', 'fontGap', 'radiusChange', 'changeStep', 'lineWidth'];
    for (var i = 0; i < ratioArr.length; i++) {
      var key = ratioArr[i];
      this[key] *= this.ratio;
    }

    this.initRadius = this.radius; // 初始圆圈半径
    this.initImgWidth = this.imgWidth; // 初始图标宽度
  }
  FlowPoint.prototype = {
    /**
     * 初始化
     * @return {[type]} [description]
     */
    init: function () {
      this.scaleDataPosition(this.data);
      this.paint();
      this.addVisibleListener();
    },
    /**
     * 绘制一帧
     * @return {[type]} [description]
     */
    paint: function () {
      var ctx = this.ctx;
      var canvas = this.canvas;
      var cacheCanvas = this.cacheCanvas;
      this.cacheCtx.clearRect(0, 0, cacheCanvas.width, cacheCanvas.height);
      this.paintPointAndLine(this.data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(cacheCanvas, 0, 0, canvas.width, canvas.height);
    },
    /**
     * 绘制所有的点（圆圈）与线
     * @param  {[type]} point [description]
     * @return {[type]}       [description]
     */
    paintPointAndLine: function (point) {
      this.drawPoint(point);
      if (point.children && point.children.length) {
        for (var i = 0; i < point.children.length; i++) {
          var p = point.children[i];
          this.drawLine(point, p);
          this.paintPointAndLine(p);
        }
      }
    },
    /**
     * 绘制所有的点（圆圈）及其相关内容
     * @param  {[type]}  point   [description]
     * @param  {Boolean} isHover [description]
     * @return {[type]}          [description]
     */
    drawPoint: function (point, isHover) {
      var ctx = this.cacheCtx;
      var that = this;
      ctx.save();
      ctx.beginPath();

      // 圆
      if (isHover) {
        ctx.fillStyle = this.hoverBgColor;
      } else {
        ctx.fillStyle = this.bgColor;
      }
      if (!point.radius) {
        point.radius = this.radius;
      }
      ctx.globalAlpha = this.opacity;
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fill();
      this.circles.push(point);

      ctx.restore();
      ctx.save();

      // 图标
      if (!point.imgWidth) {
        point.imgWidth = this.imgWidth;
      }
      var halfImgWidth = point.imgWidth / 2;
      var imgObj = this.images[point.img];
      if (!imgObj) {
        var imgObj = new Image();
        imgObj.src = point.img;
        imgObj.onload = function () {
          ctx.drawImage(imgObj, point.x - halfImgWidth, point.y - halfImgWidth, point.imgWidth, point.imgWidth);
        }
        this.images[point.img] = imgObj;
      } else {
        ctx.drawImage(imgObj, point.x - halfImgWidth, point.y - halfImgWidth, point.imgWidth, point.imgWidth);
      }

      // 文字
      // if (isHover == undefined) {
      if (!point.align) {
        point.align = this.align;
      }
      var align = point.align
      ctx.fillStyle = this.color;
      ctx.font = this.fontWeight + ' ' + this.fontSize + 'px ' + this.fontFamily;
      var textWidth = ctx.measureText(point.title).width;
      var pointX, pointY;
      var baseHeight = this.fontSize / 5;
      if (point.align === 'left') {
        pointX = point.x - textWidth - this.radius - this.fontGap;
        pointY = point.y - baseHeight + this.fontSize / 2;
      } else if (point.align === 'right') {
        pointX = point.x + this.radius + this.fontGap;
        pointY = point.y - baseHeight + this.fontSize / 2;
      } else if (point.align === 'center') {
        pointX = point.x - textWidth / 2;
        pointY = point.y - baseHeight + this.fontSize / 2;
      } else if (point.align === 'top') {
        pointX = point.x - textWidth / 2;
        pointY = point.y - baseHeight - this.radius - this.fontGap;
      } else {
        pointX = point.x - textWidth / 2;
        pointY = point.y - baseHeight + this.fontSize + this.radius + this.fontGap;
      }
      // }

      ctx.fillText(point.title, pointX, pointY);

      ctx.closePath();
      ctx.restore();
    },
    /**
     * 绘制线
     * @param  {[type]} point1 [description]
     * @param  {[type]} point2 [description]
     * @return {[type]}        [description]
     */
    drawLine: function (point1, point2) {
      var ctx = this.cacheCtx;
      ctx.save();
      ctx.beginPath();
      var gap = this.lineGap;

      var gapX, gapY;
      if (point1.y == point2.y) {
        gapY = 0;
        gapX = point1.x > point2.x ? - gap : gap;
      } else {
        var distance = this.getDistance(point1, point2);
        var angle = Math.asin((point2.y - point1.y) / distance);
        if (point2.x - point1.x < 0) {
          // console.log('gg: ', 180 / Math.PI * angle)
          angle += Math.PI / 2;
        }
        gapY = gap * Math.sin(angle);
        gapX = gap * Math.cos(angle);
        // console.log(180 / Math.PI * angle, (point1.x + gapX) + ',' + (point1.y + gapY), (point2.x - gapX) + ',' + (point2.y - gapY));
        // gapY = point1.y > point2.y ? - gap : gap;
        // gapX = gapY * ((point2.x - point1.x) / (point2.y - point1.y));
      }
      ctx.strokeStyle = this.lineColor;
      ctx.lineWidth = this.lineWidth;
      ctx.moveTo(point1.x + gapX, point1.y + gapY);
      ctx.lineTo(point2.x - gapX, point2.y - gapY);
      ctx.stroke();

      ctx.closePath();
      ctx.restore();
    },
    /**
     * 移入点（圆圈），暂未使用
     * @return {[type]} [description]
     */
    hoverPoint: function () {
      var that = this;
      this.canvas.addEventListener("mousemove", function(e) {

        var circleIndex = that.getEnterPointIndex(e);

        if (circleIndex < that.circles.length) {
          that.canvas.style.cursor = "pointer";
          if (that.hoverIndex != circleIndex) {
            that.drawPoint(that.circles[circleIndex], true);
            that.hoverIndex = circleIndex;
          }
        } else {
          that.canvas.style.cursor = "auto";
          if (that.hoverIndex != null) {
            that.drawPoint(that.circles[that.hoverIndex], false);
            that.hoverIndex = null;
          }
        }
      });
    },
    // 点击点（圆圈），暂未使用
    clickPoint: function () {
      var that = this;
      this.canvas.addEventListener("mousedown", function(e) {

      });
    },
    /**
     * 监听文档可见状态，用于避免集中响应动画
     */
    addVisibleListener: function () {
      document.addEventListener('visibilitychange', function (e) {
        flowPoint.isVisible = !e.target.hidden;
      })
    },
    /**
     * 获得点集合
     * @param  {[type]} point [description]
     * @return {[type]}       [description]
     */
    getPoints: function (point) {
      var points = [];
      if (point.push) {
        points = point;
      } else {
        points.push(point);
      }
      return points;
    },
    /**
     * 获得下一级所有点集合
     * @param  {[type]} point [description]
     * @return {[type]}       [description]
     */
    getChildrenPoints: function (point) {
      var points = flowPoint.getPoints(point);
      var childrenPoints = [];
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        if (p.children && p.children.length) {
          flowPoint.addArray(childrenPoints, p.children);
        }
      }
      return childrenPoints;
    },
    /**
     * 将第二个数组中的元素依次添加到第一个数组中
     * @param {[type]} arr1 [description]
     * @param {[type]} arr2 [description]
     */
    addArray: function (arr1, arr2) {
      for (var i = 0; i < arr2.length; i++) {
        arr1.push(arr2[i]);
      }
    },
    /**
     * 改变点（圆圈）的大小与图标大小
     * @param  {[type]} point [description]
     * @return {[type]}       [description]
     */
    changeRadius: function (point) {
      var points = flowPoint.getPoints(point);
      var p = points[0];
      if (p.radius > flowPoint.maxRadius) {
        flowPoint.radiusChange = - Math.abs(flowPoint.radiusChange);
      } else if (p.radius <= flowPoint.minRadius) {
        flowPoint.radiusChange = Math.abs(flowPoint.radiusChange);
      }
      flowPoint.imgWidthChange = flowPoint.radiusChange * flowPoint.imgWidthChangeRatio;
      // flowPoint.imgWidthChange = flowPoint.radiusChange;
      for (var i = 0; i < points.length; i++) {
        points[i].radius += flowPoint.radiusChange;
        points[i].imgWidth += flowPoint.imgWidthChange;
        if (points[i].imgWidth > flowPoint.maxImgWidth) { // 大于最大值
          points[i].imgWidth = flowPoint.maxImgWidth;
        } else if (points[i].imgWidth < flowPoint.minImgWidth) { // 小于最小值
          points[i].imgWidth = flowPoint.minImgWidth;
        } else if (points[i].imgWidth < flowPoint.initImgWidth) { // 大于最小值，小于正常值
          // 如果是以1个单位自增，并且圆圈的大小小于等于初始值减去1个单位的大小，并且
          if (flowPoint.radiusChange === flowPoint.changeStep 
            && points[i].radius <= flowPoint.initRadius - flowPoint.changeStep
            && points[i].imgWidth > flowPoint.initImgWidth - flowPoint.changeStep) {
            points[i].imgWidth = flowPoint.initImgWidth - flowPoint.changeStep;
          }
        }
      }
    },
    /**
     * 开始一个点（圆圈）的动画
     * @param  {[type]} point [description]
     * @return {[type]}       [description]
     */
    animatePoint: function (point) {
      flowPoint.changeRadius(point);
      var points = flowPoint.getPoints(point);
      var p = points[0];
      flowPoint.paint();
      if (p.radius == flowPoint.initRadius && flowPoint.radiusChange > 0) {
        console.log('gg')
      } else {
        requestNextAnimationFrame(function () {
          // flowPoint.animateOnce(point);
          flowPoint.animatePoint(point);
        });
        // setTimeout(flowPoint.animateOnce, 60);
      }
    },
    /**
     * 所有点（圆圈）执行一遍动画
     * @param  {[type]} point [description]
     * @return {[type]}       [description]
     */
    animateOnce: function (point) {
      var points = flowPoint.getPoints(point);
      flowPoint.animatePoint(points);
      // if (flowPoint.currentPoint != point) {
      //   flowPoint.currentPoint = point;
        var childrenPoints = flowPoint.getChildrenPoints(points);
        if (childrenPoints.length) {
          if (flowPoint.isVisible) {
            setTimeout(function () {
              flowPoint.animateOnce(childrenPoints);
            }, flowPoint.period);
          } else {
            var temp = setInterval(function () {
              if (flowPoint.isVisible) {
                clearInterval(temp);
                setTimeout(function () {
                  flowPoint.animateOnce(childrenPoints);
                }, flowPoint.period);
              }
            }, 5000);
          }
        } else {
          flowPoint.finish = true;
        }
      // }
    },
    /**
     * 循环执行动画
     * @return {[type]} [description]
     */
    animate: function () {
      flowPoint.animateOnce(flowPoint.data);
      setInterval(function () {
        if (flowPoint.finish) {
          flowPoint.finish = false;
          setTimeout(function () {
            flowPoint.animateOnce(flowPoint.data);
          }, flowPoint.period);
        }
      }, 1000);
    },
    /**
     * 获得两点之间的距离
     * @param  {[type]} point1 [description]
     * @param  {[type]} point2 [description]
     * @return {[type]}        [description]
     */
    getDistance: function (point1, point2) {
      var dx = point1.x - point2.x;
      var dy = point1.y - point2.y;
      return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    },
    /**
     * 获得光标位置对应canvas中的位置
     * @param  {[type]} x [description]
     * @param  {[type]} y [description]
     * @return {[type]}   [description]
     */
    getCanvasLocation: function(x, y) {
      var canvas = this.canvas;
      var bbox = canvas.getBoundingClientRect();
      var o_point_canvas = new MyPoint(x - bbox.left * (canvas.width / bbox.width), y - bbox.top * (canvas.height / bbox.height));
      return o_point_canvas;
    },
    /**
     * 获得canvas中的点对应window的位置
     * @param  {[type]} x [description]
     * @param  {[type]} y [description]
     * @return {[type]}   [description]
     */
    getWindowLocation: function(x, y) {
      var canvas = this.canvas;
      // var bbox = canvas.getBoundingClientRect();
      var bbox = {left: canvas.offsetLeft, top: canvas.offsetTop, width: canvas.offsetWidth, height: canvas.offsetHeight};
      //alert(x+","+y);
      //alert(bbox.left+","+bbox.top);
      var o_point_window = new MyPoint(bbox.left * (canvas.width / bbox.width) + x, bbox.top * (canvas.height / bbox.height) + y);
      return o_point_window;
    },
    /**
     * 是否进入到路径中
     * @param  {[type]}  x [description]
     * @param  {[type]}  y [description]
     * @return {Boolean}   [description]
     */
    isEnter: function(x, y) {
      var point = this.getCanvasLocation(x, y);
      // console.log(point)
      return this.ctx.isPointInPath(point.x, point.y);
    },
    /**
     * 获得光标进入点的序号
     * @param  {[type]} e [description]
     * @return {[type]}   [description]
     */
    getEnterPointIndex: function (e) {
      // var isHover = false;
      for (var i = 0; i < this.circles.length; i++) {
        var c = this.circles[i];
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, this.radius, 0, Math.PI * 2);
        if (this.isEnter(e.clientX, e.clientY)) {
          // isHover = true;
          break;
        }
      }
      return i;
    },
    scaleDataPosition: function (point) {
      point.x = point.x * this.ratio;
      point.y = point.y * this.ratio;
      if (point.children && point.children.length) {
        for (var i = 0; i < point.children.length; i++) {
          var p = point.children[i];
          this.scaleDataPosition(p);
        }
      }
    }
  }
  var flowPoint;
  return function (options) {
    flowPoint = new FlowPoint(options);
    return flowPoint;
  }
} ());
