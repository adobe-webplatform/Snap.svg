define(function (require) {

	require('snap');
	
	var App,
		Heart = require('app/heart'),
		Device = require('app/device'),
		Burst = require('app/burst');
		Mesh = require('app/mesh');
		Logo = require('app/logo');

	App = function () {
		var instance = this;
		
		this.started = false;
				
		this.init = function () {
			var timeline,
				ad,
				s,
				cover,
				device,
				heart,
				burst,
				screen1,
				text1,
				text2,
				text3,
				text4,
				resolveScreen,
				logo,
				meshA,
				meshAContainer,
				replaycount = 0,
				WIDTH = 400,
				HEIGHT = 400,
				WHITE = "#ffffff",
				GREEN = "#09ae8a";
			
			this.started = true;
			
			ad = document.getElementById('ad');
			s = new Snap("#ad");
			cover = s.select('#cover');
			meshAContainer = s.select('#meshAContainer');
			screen1 = s.select('#screen1');
			text1 = s.select('#text1');
			text2 = s.select('#text2');
			text3 = s.select('#text3');
			text4 = s.select('#text4');
			replayBtn = s.select('#replay-btn');
			resolveScreen = s.select('#resolve');
			logo = new Logo(s);
			
			handle_RESIZE();
			window.addEventListener('resize', handle_RESIZE);
			ad.addEventListener('click', handle_CLICK);			
			replayBtn.click(replay_CLICK);
			
			addMeshA();	
			cover.remove();
			addHeart();
			addComputer();
			addBurst();
			
			function addHeart() {
				heart = new Heart(s, WIDTH / 2, HEIGHT / 2);
			}
			
			function addComputer() {
				device = new Device(s, WIDTH / 2, HEIGHT / 2);
				device.setScreen(192, 112);
				device.setBack(208, 148);
				device.setScale(0.1);
				text2.after(device.el);
			}
			
			function addBurst() {
				burst = new Burst(s);
			}
			
			function addMeshA() {
				meshA = new Mesh(s, meshAContainer, '#afafaf', '#afafaf');
			}
			
			function addMeshB() {
				meshA.el.remove();
				meshB = new Mesh(s, meshBContainer, '#09ae8a', '#777777');
			}
			
			function showMeshB() {
				if (mobilecheck() !== true) {
					meshB.start();
				}
			}
			
			function showComputer() {
				text1.animate({y: 80}, 100);
				text2.animate({y: 350}, 100);
				device.animScale(10, 300, mina.bounce);
				heart.animFill(WHITE);
			}
			
			function toTablet() {
				device.animRotation(-90);	
				device.animScreen(76, 100);
				device.animBack(92, 132);
				heart.animScale(0.5, 200);				
			}
			
			function toPhone() {
				device.hideKeyboard();
				device.animScreen(48, 76);
				device.animBack(56, 100);
				heart.animScale(0.3);
			}
			
			function rotate() {
				device.animRotation(90);
				heart.animScale(0.4);
			}
			
			function zoom() {
				meshA.stop();
				device.animScale(10, 600);
				heart.animScale(4, 600);
				burst.anim();
			}
			
			function greenMesh() {
				
				meshA.setColor('#09ae8a', '#777777');
				
				if (mobilecheck() !== true) {
					meshA.start();
				}
				
				device.animOpacity(0, 200);
				screen1.animate({
					opacity: 0
				}, 100);
			}
			
			function maskReveal() {
				heart.mask();
			}
			
			function showText3() {
				device.setScale(0.01);
				text3.animate({
					opacity: 1
				}, 200);
			}
			
			function hideText3() {
				text3.animate({
					opacity: 0
				}, 200);
				
				if (mobilecheck() !== true) {
					meshA.rippleColor('#afafaf', '#afafaf');
				} else {
					meshA.setColor('#afafaf', '#afafaf');
				}
			}
			
			function resolve() {
				resolveScreen.animate({
					opacity: 1
				}, 200);
			}
			
			function stop() {
				logo.animate();
				meshA.stop();
			}
			
			function reset() {
				resolveScreen.attr({
					opacity: 0
				});		
				
				screen1.attr({
					opacity: 1
				});
				
				text1.attr({y: 130});
				text2.attr({y: 300});
				
				heart.setScale(1);
				heart.setFill('#0DAE8A');
				heart.unmask();
				device.setOpacity(1);
				device.setScreen(192, 112);
				device.setBack(208, 148);
				device.showKeyboard();
				meshA.start();
				burst.reset();
			}
			
			function replay_CLICK(e) {
				e.stopPropagation();
				
				replaycount += 1;
				ga('send', 'event', 'button', 'click', 'replay', replaycount);
				reset();
				run();
			}
			
			function handle_CLICK(e) {
				ga('send', 'event', 'button', 'click', 'ad');
				top.window.location.href = 'http://snapsvg.io/';
			}
			
			function handle_RESIZE() {
				var _w = window.innerWidth,
					scale = _w / 400;
				
				ad.style.webkitTransform = 'scale(' + scale + ')';
				ad.style.MozTransform = 'scale(' + scale + ')';
				ad.style.msTransform = 'scale(' + scale + ')';
				ad.style.oTransform = 'scale(' + scale + ')';
				ad.style.transform = 'scale(' + scale + ')';
				
			}
			
			function run() {
				if (mobilecheck() !== true) {
					meshA.start();
				}
				setTimeout(showComputer, 2000);
				setTimeout(toPhone, 3000);
				setTimeout(rotate, 4000);
				setTimeout(toTablet, 5000);
				setTimeout(zoom, 6000);
				setTimeout(greenMesh, 6300);
				setTimeout(maskReveal, 6700);
				setTimeout(showText3, 7000);
				setTimeout(hideText3, 10000);
				setTimeout(resolve, 10500);
				setTimeout(stop, 10900);
			}
			
			function basic() {
				screen1.attr({opacity: 0});
				heart.el.attr({opacity: 0});
				replayBtn.attr({opacity: 0});
				logo.show();
				text4.select('tspan').attr({opacity: 0});
				text4.select('tspan:nth-child(2)').attr({y: 120});
				resolveScreen.attr({opacity: 1});
			}
			
			if (window.replay !== true) {
				replayBtn.attr({opacity: 0});
			}
			
			if (window.supported !== false) {
				run();
			} else {
				basic();
			}
			
		}
		
	}

	return App;
});