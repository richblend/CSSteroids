/* Author: 

*/


$(document).ready(function(){
	
	var game = {
		
		
		ship: 0,
		loopInt: 0,
		stageWidth: $("body").width(),
		stageHeight: $("body").height(),
		lives: 3,
		score: 0,
		isPlaying: false,
		enemy: null,
		enemyInterval: 0,
		explosion: null,
		
		
		intro: function(){
			background.create();
			
			asteroidController.makeAsteroid(1);
			asteroidController.makeAsteroid(1);
			asteroidController.makeAsteroid(1);
			asteroidController.makeAsteroid(1);
			asteroidController.makeAsteroid(1);
			asteroidController.makeAsteroid(1);
			loopInt = setInterval(game.loop, 20);
			
			$("#introScreen a").click(function(){
				game.start();
			});
		},
		
		start: function(){
			renderer.removeAllAsteroids();
			$("#introScreen").hide();		
			this.respawn();
			game.isPlaying = true;	
			
			game.enemyInterval = setInterval(game.makeEnemy, 15000);
			//game.makeEnemy();
			
		},
		makeEnemy: function(){
			game.enemy = enemyFactory.makeEnemy();
			renderer.addSprite(game.enemy);
			
			log("make enemy, game.enemy = " + game.enemy);
		},
		makeExplosion: function(x, y){
			x -= 50;
			y -= 50;
			if(game.explosion){
				game.explosion.remove();
				game.explosion = null;	
			}
			game.explosion = $('<div class="explosion"><div class="e1 sprite">.</div><div class="e2 sprite">.</div><div class="e3 sprite">.</div><div class="e4 sprite">.</div><div class="e5 sprite">.</div></div>');
			game.explosion.css("top", y + "px");
			game.explosion.css("left", x + "px");
			$("#gameScreen").append(game.explosion);	
			for(var i = 1; i <= 5; i++)
			{ 
				var x = (Math.random() * 100) - 50;
				var y = (Math.random() * 100) - 50;
				//log("x = " + x + ", y = " + y);
				$(".explosion .e" + i).animate({top: y + "px", left: x + "px"}, 1000, null, game.removeExplosion);
			}
			
		},
		removeExplosion: function(){
			game.explosion.remove();
			//game.explosion = null;	
		},
		loop: function(){
			if(game.isPlaying) asteroidController.tick();
			renderer.tick();
			collider.tick();	
		},
		die: function(){
			this.lives--;
			if(this.lives == 0){
				this.gameOver();
			} else { 
				setTimeout(this.respawn, 2000);	
			}
			for(var i = 3; i > this.lives; i--)
			{
				$(".lives .life" + i).hide();	
			}
			
		},
		respawn: function(){
			renderer.removeSprite(game.ship);
			game.ship = null;
			game.ship = shipFactory.makeShip();
			
			game.ship.x = game.stageWidth / 2;
			game.ship.y = game.stageHeight / 2;
			renderer.addSprite(game.ship);
			game.ship.clearThrust();
		},
		addScore: function(awarded){
			if(game.isPlaying)
			{
				game.score += awarded;
				$(".score").html(game.score);	
			}
		},
		gameOver: function(){
			clearInterval(game.enemyInterval);
			game.isPlaying = false;	
			$("#gameOverScreen").show();
			$("#gameOverScreen .finalScore").html("SCORE: " + game.score);
			$("#gameOverScreen a").click(function(){location.reload()});
		}
		
		
			
	};
	
	var renderer = {
		sprites: [],
		
		addSprite: function(sprite){
			renderer.sprites.push(sprite);
			$("#gameScreen").append(sprite.sprite);	
			
		},
		
		removeSprite: function(sprite){
			var l = this.sprites.length;
			for(var i = 0; i < l; i++)
			{
				var testSprite = this.sprites[i];
				if(testSprite == sprite)
				{
					testSprite.sprite.remove();
					this.sprites.splice(i, 1);
					break;	
				}
			}
		},
		removeAllAsteroids: function(){
			for(var i = 0; i < renderer.sprites.length; i++)
			{
				if(renderer.sprites[i].type == 1)
				{
					renderer.sprites[i].sprite.remove();
					this.sprites.splice(i, 1);
				}
			}
		},
		tick: function(){
			for(var i = 0; i < renderer.sprites.length; i++)
			{
				var sprite = renderer.sprites[i];
				sprite.tick();	
				if(sprite.rotation > 360) sprite.rotation -= 360; 	
				if(sprite.rotation < 0) sprite.rotation += 360; 	
				var x = sprite.x >> 0;
				var y = sprite.y >> 0;
				var r = sprite.rotation >> 0;
				
				sprite.sprite.css("left", x + "px");
				sprite.sprite.css("top", y + "px"); 
				sprite.sprite.css("-webkit-transform", "rotate("+r+"deg)");
				sprite.sprite.css("-moz-transform", "rotate("+r+"deg)");
			}
		}
	}
	
	var collider = {
		asteroids: [],
		bullets: [],
		
		addSprite: function(sprite){
			if(sprite.type === 1) collider.asteroids.push(sprite);
			if(sprite.type === 2) collider.bullets.push(sprite);		
		},
		
		removeSprite: function(sprite){
			if(sprite.type === 1)
			{
				var l = this.asteroids.length;
				for(var i = 0; i < l; i++)
				{
					var testSprite = this.asteroids[i];
					if(testSprite == sprite)
					{
						testSprite.sprite.remove();
						this.asteroids.splice(i, 1);
						break;	
					}
				}
			}
			if(sprite.type === 2)
			{
				var l = this.bullets.length;
				for(var i = 0; i < l; i++)
				{
					var testSprite = this.bullets[i];
					if(testSprite == sprite)
					{
						testSprite.sprite.remove();
						this.bullets.splice(i, 1);
						break;	
					}
				}
			}
		},
		
		tick: function(){
			
			//There must be a ton of optimisation I can do here... One day.
			
			//test all bullets against all asteroids
			var bl = this.bullets.length;
			for(var i = 0; i < bl; i++)
			{
				var bullet = this.bullets[i];
				
				//first time round, hijack this loop to ht test against a possible enemy
				if(game.enemy && i == 0 && !bullet.isEnemyBullet){
					var xDiff = bullet.x - game.enemy.x + 25;
					var yDiff = bullet.y - game.enemy.y + 25;
					var distance = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
					
					if(distance < 20)game.enemy.destroy(true);
					
					log(distance);
					var testX = game.enemy.x + 25;
					var testY = game.enemy.y + 10;
					$("#test1").css("top", testY + "px");
					$("#test1").css("left", testX + "px");
					
				}
				
				var al = this.asteroids.length;
				for(var j = 0; j < al; j++)
				{	
					var asteroid = this.asteroids[j];
					
					var xDiff = bullet.x - asteroid.x - asteroid.radius;
					var yDiff = bullet.y - asteroid.y - asteroid.radius;
					var distance = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
					
					if(distance < asteroid.radius)
					{
						//simple collision
						game.makeExplosion(bullet.x, bullet.y);
						bullet.destroy();
						asteroid.destroy();
						return;	
						
					}
										
				}
				
				//test enemy bullets against ship
				if(bullet.isEnemyBullet)
				{
					//incredibly lazy hit detection. I apologise.
					var xDiff = bullet.x - game.ship.x;
					var yDiff = bullet.y - game.ship.y;
					var distance = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
					if(distance < 25)
					{
						bullet.destroy();
						game.ship.destroy();	
					}
				}
			}
			
			
			//seperate loop to detect if asteroids are hitting ship
			var al = this.asteroids.length;
			for(var k = 0; k < al; k++)
			{
				var asteroid = this.asteroids[k];
				var xDiff = game.ship.x + 15 - asteroid.x - asteroid.radius;
				var yDiff = game.ship.y + 25 - asteroid.y - asteroid.radius;
										
				var shipDis = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
				if(shipDis < 100)
				{
					//close to asterod, do 3 point hit test
					
					//translate points
					var rotation1 =  game.ship.rotation * 0.0174532925; //degs to rads
					
					var x1 = game.ship.x + 15 + 0 + (Math.sin(rotation1) * 25);	
					var y1 = game.ship.y + 0 + 25 - (Math.cos(rotation1) * 25);
					
					var rotation2 =  (game.ship.rotation + 180 + 40) * 0.0174532925; //degs to rads
					
					var x2 = game.ship.x + 15 + 0 + (Math.sin(rotation2) * 20);	
					var y2 = game.ship.y + 0 + 25 - (Math.cos(rotation2) * 20);
					
					var rotation3 =  (game.ship.rotation + 180 - 40) * 0.0174532925; //degs to rads
					
					var x3 = game.ship.x + 15 + 0 + (Math.sin(rotation3) * 20);	
					var y3 = game.ship.y + 0 + 25 - (Math.cos(rotation3) * 20);
					
					var shipPoints = [{x: x1, y: y1}, {x: x2, y: y2}, {x: x3, y: y3}];
					
					
								
					for(var i = 0; i < 3; i++)
					{
						//pythag on these new points
						var xDiff = shipPoints[i].x - asteroid.x - asteroid.radius;
						var yDiff = shipPoints[i].y - asteroid.y - asteroid.radius;
						var distance = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
						if(distance <= asteroid.radius)
						{
							asteroid.destroy();
							game.ship.destroy();	
						}
					}
					
					
				}	
			}
		}	
		
		
		
	}
	
	var spriteFactory = {
		makeSprite: function(type){
			var obj = {};
			obj.type = type;
			obj.sprite = "";
			obj.x = 0;
			obj.y = 0;
			obj.rotation = 0;
			obj.width = 0;
			obj.height = 0;
			obj.yVector = 0;
			obj.xVector = 0;
			obj.rVector = 0;
			obj.alive = true;
			return obj;	
		}
	};
	
	var enemyFactory = {
		makeEnemy: function(){
			
			var obj = spriteFactory.makeSprite(3);
			obj.radius = 25;
			if(Math.random() > 0.5)
			{
				obj.x = game.stageWidth;
				obj.xVector = -2;
				
			} else {
				
				obj.x = 0;	
				obj.xVector = 2;
				
			}
			obj.tick = function(){
				
				this.x += this.xVector;
				this.y += this.yVector;
						
				if(this.xVector < 0)
				{
					if(this.x < 0)this.destroy();
				} else {
					if(this.x > game.stageWidth)this.destroy();	
				}
				
			}
			obj.destroy = function(wasKilled){
				if(wasKilled) game.addScore(200);
				renderer.removeSprite(this);
				clearInterval(this.tickInterval);
				game.enemy = null;
				
				
			}
			obj.decisionTick = function(){
				
				this.yVector = (Math.random() * 4) - 2;
				
				if(Math.random() > 0.4) this.fire();
			}
			
			obj.fire = function(){
				var targetAngle;
				
				//Oh my god, my trig sucks. 
				if(this.y > game.ship.y){
					targetAngle = Math.atan((game.ship.x + 15 - this.x) / -(game.ship.y + 25 - this.y));
				} else {
					targetAngle = Math.atan((game.ship.x + 15 - this.x) / -(game.ship.y + 25 - this.y)) + Math.PI;	
				}
				
				targetAngle += (Math.random() - 0.5) / 3;
				
				var bullet = enemyFactory.makeBullet(this.x, this.y, targetAngle);
				renderer.addSprite(bullet);	
				collider.addSprite(bullet);	
			}
			
			obj.tickInterval = setInterval(function(){obj.decisionTick(obj);}, 1000); 
			
			
			
			obj.y = Math.random() * game.stageHeight;
			obj.sprite = $('<div class="enemy sprite"><div class="cabin"></div><div class="divider asPoly"></div><div class="topBottom asPoly"></div><div class="tl asPoly"></div><div class="bl asPoly"></div><div class="tr asPoly"></div><div class="br asPoly"></div></div>');
			
			return obj;
		},
		makeBullet: function(x, y, direction){
								
				var obj = spriteFactory.makeSprite(2);
				obj.sprite = $('<span class="bullet sprite"></span>');
				obj.thrust = 4;
				obj.rotation = direction; //as rads, for a change
				obj.x = x;
				obj.y = y;
				obj.isEnemyBullet = true;			
				obj.xVector += Math.sin(obj.rotation) * obj.thrust;
				obj.yVector -= Math.cos(obj.rotation) * obj.thrust;
				
				obj.tick = function(){
					this.x += this.xVector;
					this.y += this.yVector;	
					
					if(this.x > game.stageWidth || this.y > game.stageHeight || this.y < 0 || this.x < 0)
					{
						renderer.removeSprite(this);	
						collider.removeSprite(this);
					}
				}
				
				obj.destroy = function(){
					renderer.removeSprite(this);
					collider.removeSprite(this);		
				}
				return obj;
			}
		
	}
	
	var asteroidFactory = {
		makeAsteroid: function(stage, x, y){
			var obj = spriteFactory.makeSprite(1);
			obj.stage = stage;
			
			if(stage == 1)
			{
				obj.width = 80;
				obj.height = 80;
				obj.radius = 40;
				if(Math.random() > 0.5)
				{
					//vertical
					obj.x = Math.random() * game.stageWidth;
					obj.y = 0;
				} else {
					obj.y = Math.random() * game.stageHeight;
					obj.x = 0;	
				}
				
				if(Math.random() > 0.5)
				{
					obj.sprite = $('<div class="sprite largeAsteroid1" ><div class="p1 asPoly"></div><div class="p2 asPoly"></div><div class="p3 asPoly"></div><div class="p4 asPoly"></div><div class="p5 asPoly"></div><div class="p6 asPoly"></div><div class="p7 asPoly"></div><div class="p8 asPoly"></div><div class="p9 asPoly"></div><div class="p10 asPoly"></div></div>');
				} else {
					obj.sprite = $('<div class="sprite largeAsteroid2" ><div class="p1 asPoly"></div><div class="p2 asPoly"></div><div class="p3 asPoly"></div><div class="p4 asPoly"></div><div class="p5 asPoly"></div><div class="p6 asPoly"></div><div class="p7 asPoly"></div><div class="p8 asPoly"></div><div class="p9 asPoly"></div><div class="p10 asPoly"></div><div class="p11 asPoly"></div><div class="p12 asPoly"></div><div class="p13 asPoly"></div></div>');	
				}
			}
			if(stage == 2)
			{
				obj.width = 30;
				obj.height = 30;
				obj.radius = 15;	
				obj.x = x;
				obj.y = y;
				
				if(Math.random() > 0.5)
				{
					obj.sprite = $('<div class="sprite largeAsteroid1" style="width: 40px; height: 40px"><div class="p1 asPoly"></div><div class="p2 asPoly"></div><div class="p3 asPoly"></div><div class="p4 asPoly"></div><div class="p5 asPoly"></div><div class="p6 asPoly"></div><div class="p7 asPoly"></div><div class="p8 asPoly"></div><div class="p9 asPoly"></div><div class="p10 asPoly"></div></div>');
				} else {
					obj.sprite = $('<div class="sprite largeAsteroid2" style="width: 30px; height: 30px"><div class="p1 asPoly"></div><div class="p2 asPoly"></div><div class="p3 asPoly"></div><div class="p4 asPoly"></div><div class="p5 asPoly"></div><div class="p6 asPoly"></div><div class="p7 asPoly"></div><div class="p8 asPoly"></div><div class="p9 asPoly"></div><div class="p10 asPoly"></div><div class="p11 asPoly"></div><div class="p12 asPoly"></div><div class="p13 asPoly"></div></div>');	
				}
			}
			
			if(stage == 3)
			{
				obj.width = 20;
				obj.height = 20;
				obj.radius = 10;	
				obj.x = x;
				obj.y = y;
				
				if(Math.random() > 0.5)
				{
					obj.sprite = $('<div class="sprite largeAsteroid1" style="width: 27px; height: 27px"><div class="p1 asPoly"></div><div class="p2 asPoly"></div><div class="p3 asPoly"></div><div class="p4 asPoly"></div><div class="p5 asPoly"></div><div class="p6 asPoly"></div><div class="p7 asPoly"></div><div class="p8 asPoly"></div><div class="p9 asPoly"></div><div class="p10 asPoly"></div></div>');
				} else {
					obj.sprite = $('<div class="sprite largeAsteroid2" style="width: 20px; height: 20px"><div class="p1 asPoly"></div><div class="p2 asPoly"></div><div class="p3 asPoly"></div><div class="p4 asPoly"></div><div class="p5 asPoly"></div><div class="p6 asPoly"></div><div class="p7 asPoly"></div><div class="p8 asPoly"></div><div class="p9 asPoly"></div><div class="p10 asPoly"></div><div class="p11 asPoly"></div><div class="p12 asPoly"></div><div class="p13 asPoly"></div></div>');	
				}
			}
			
			//obj.rotation = Math.random() * 360;
			obj.yVector = Math.random() * 2 - 1;
			obj.xVector = Math.random() * 2 - 1;
			
			
			
			obj.tick = function(){
				
				this.x += this.xVector;
				this.y += this.yVector;
				
				if(this.x > game.stageWidth)this.x = 0;
				if(this.y > game.stageHeight)this.y = 0;
				if(this.y < 0 - (this.radius * 2))this.y = game.stageHeight;
				if(this.x < 0 - (this.radius * 2))this.x = game.stageWidth;
			}
			
			obj.destroy = function(){
				
				if(this.stage == 1)
				{
					game.addScore(20);
					
					//make sub asteroids
					var asteroid1 = asteroidFactory.makeAsteroid(2, this.x, this.y);
					var asteroid2 = asteroidFactory.makeAsteroid(2, this.x, this.y);
					renderer.addSprite(asteroid1);
					renderer.addSprite(asteroid2);	
					collider.addSprite(asteroid1);
					collider.addSprite(asteroid2);
				}
				if(this.stage == 2)
				{
					game.addScore(50);
					
					//make sub asteroids
					var asteroid1 = asteroidFactory.makeAsteroid(3, this.x, this.y);
					var asteroid2 = asteroidFactory.makeAsteroid(3, this.x, this.y);
					renderer.addSprite(asteroid1);
					renderer.addSprite(asteroid2);	
					collider.addSprite(asteroid1);
					collider.addSprite(asteroid2);
				}
				if(this.stage == 3)
				{
					game.addScore(100);
				}
				collider.removeSprite(this);
				renderer.removeSprite(this);
					
			}
			
			return obj;
		
		}	
			
	}
	
	var shipFactory = {
			makeShip: function(){
				var obj = spriteFactory.makeSprite();
				obj.width = 30;
				obj.height = 50;
				obj.sprite = $('<div id="ship" class="ship sprite"><div class="left asPoly"></div><div class="right asPoly"></div><div class="bottom asPoly"></div><span>V</span></div>');
				obj.incrementalRVector = 0;
				obj.incrementalThrustVector = 0;
				obj.thrust = 0;
				obj.thrusterGraphic = $("#ship span");
				
				obj.left = function(){
					if(this.alive) this.rVector = -5;
				}
				
				obj.right = function(){
					if(this.alive) this.rVector = 5;
				}
				
				obj.boost = function(){
					if(this.alive){
						this.thrust = 0.10;
						$("#ship span").show();
					}
				}
				
				obj.clearInput = function(){
					this.rVector = 0;
				}
				
				obj.clearThrust = function(){
					this.thrust = 0;	
					$("#ship span").hide();
				}
				
				obj.fire = function(){
					var bullet = shipFactory.makeBullet();
					bullet.isEnemyBullet = false;
					renderer.addSprite(bullet);	
					collider.addSprite(bullet);
					
				}
				
				obj.destroy = function(){
					$("#ship .left").animate({left: '-30px'}, 1000);
					$("#ship .right").animate({top: '-10px'}, 1000);
					$("#ship .bottom").animate({top: '-10px'}, 1000);
					if(this.alive)game.die();
					this.alive = false;
				}
				
				obj.tick = function(){
					//this.rVector += this.incrementalRVector;	
					this.rotation += this.rVector;
					
					this.thrust += this.incrementalThrustVector;
					this.xVector += Math.sin(helpers.degsToRads(this.rotation)) * this.thrust;
					this.yVector -= Math.cos(helpers.degsToRads(this.rotation)) * this.thrust;
					
					this.x += this.xVector;
					this.y += this.yVector;
					
					if(this.x > game.stageWidth)this.x = 0;
					if(this.y > game.stageHeight)this.y = 0;
					if(this.y < 0)this.y = game.stageHeight;
					if(this.x < 0)this.x = game.stageWidth;
				}
				
				return obj;	
			},
			
			makeBullet: function(){
				var rotation =  game.ship.rotation * 0.0174532925; //degs to rads
					
				var x = game.ship.x + 15 + 0 + (Math.sin(rotation) * 25);	
				var y = game.ship.y + 0 + 25 - (Math.cos(rotation) * 25);
				
				var obj = spriteFactory.makeSprite(2);
				obj.sprite = $('<span class="bullet sprite"></span>');
				obj.thrust = 13;
				obj.rotation = game.ship.rotation;
				obj.x = x;
				obj.y = y;
				obj.xVector += Math.sin(helpers.degsToRads(obj.rotation)) * obj.thrust;
				obj.yVector -= Math.cos(helpers.degsToRads(obj.rotation)) * obj.thrust;
				
				obj.tick = function(){
					this.x += this.xVector;
					this.y += this.yVector;	
					
					if(this.x > game.stageWidth || this.y > game.stageHeight || this.y < 0 || this.x < 0)
					{
						renderer.removeSprite(this);	
						collider.removeSprite(this);
					}
				}
				
				obj.destroy = function(){
					renderer.removeSprite(this);
					collider.removeSprite(this);		
				}
				return obj;
			}
	}
	
	var asteroidController = {
		tick: function(){
			if(Math.random() > 0.99)
			{
				this.makeAsteroid();	
			}
		},
		makeAsteroid: function(){
			var asteroid = 	asteroidFactory.makeAsteroid(1);
			renderer.addSprite(asteroid);
			collider.addSprite(asteroid);
		}
	}
	
	var background = {
		create: function(){
			var screen = $("#gameScreen");
			for(var i = 0; i < 150; i++)
			{
				var randX = (Math.random() * game.stageWidth) >> 0;
				var randY = (Math.random() * game.stageHeight) >> 0;
				var size = (Math.random() * 20 + 5) >> 0;
				var html = 	'<span class="star" style="top: '+randY+'px; left: '+randX+'px; font-size: '+size+'px">.</span>';
				screen.append(html);
			
			}
		}
	}
	
	var helpers = {
		degsToRads: function(degs){
			return degs * 0.0174532925;
		}
	}
			
	game.intro();
	
	
	document.onkeydown = function(e)
	{
		e.preventDefault();
		if(e.keyCode == 37)
		{
			game.ship.left();
			
		}
		if(e.keyCode == 39)
		{
			game.ship.right();
		}
		if(e.keyCode == 38)
		{
			game.ship.boost();
			
		}
		if(e.keyCode == 40)
		{
			//game.ship.boost();
			
		}
		if(e.keyCode == 32)
		{
			game.ship.fire();
		}
	}
	
	document.onkeyup = function(e)
	{
		e.preventDefault();
		if(e.keyCode == 38)
		{
			game.ship.clearThrust();
			
		} else if(e.keyCode != 32)
		{
			game.ship.clearInput();
		}
		
	}


	
	
});





















