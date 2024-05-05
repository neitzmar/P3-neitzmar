//Attribution:      This was inspired by patorjk's javascript snake: https://patorjk.com/games/snake/
//                  I followed this tutorial by SSaural to recreate snake as well: https://www.ssaurel.com/blog/learn-how-to-create-the-classic-snake-game-with-the-canvas-api-and-the-html5-javascript-duo/
//                  To show my understanding, I've added comments on the segments of borrowed code.
//                  Furthermore, I've attempted to make the project my own by refining the visuals, fixing some errors I noticed with movement,
//                  adding more user input options (WASD and arrows), changing loss conditions (hitting the wall kills you),
//                  and informing users when they've lost, as well as how many points they had.

//Instructions:     To start the game, press any arrow key, WASD, or enter. Your movements are controlled by WASD or the arrows.
//                  Consume as many apples as possible to get the highest amount of points!
//                  Avoid the walls of the board and yourself. Hitting either will kill you!
//                  If you need to pause, press the pause button or "esc" on your keyboard.
//                  To continue from the pause position, press continue or "enter" on your keyboard.  

let canvas = document.getElementById("board"); //grabbing the canvas from snake.html

//loading in the MS paint drawn images for the head, body, and apple:
const headImg = new Image();
headImg.src = 'head.png';

const bodyImg = new Image();
bodyImg.src = 'body2.png';

const appleImg = new Image();
appleImg.src = 'apple.png';

//We use this function to select the x and y points for an apple to spawn in. In this case, the max will be the number of boxes in the x and y direction
//In our current implementation, there are 20 boxes, so the official range is 0-20.
function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

var secondspassed, oldtimestamp, realfps, then, now, elapsed;

class Snake {
    constructor(ctx, bw, bh, nbx, nby, fps) {
        this.ctx = ctx;

        //so long as nbx/nby and bw/bh are equivalent, they will be perfect boxes:
        this.bw = bw; //board width
        this.bh = bh; //board height

        this.eltw = bw / nbx; //this is the width of each box, depending on the board with and the number of boxes in the x direction
        this.elth = bh / nby; //this is the height of each box, depending on the board with the number of boxes in the y direction
       
        this.nbx = nbx; //number of boxes in the x direction
        this.nby = nby; //number of the boxes in the y direction

        this.dirx = 1;
        this.diry = 0;

        //all false just to start, this will change depending on user input
        this.keyup = false;
        this.keydown = false;
        this.keyleft = false;
        this.keyright = false;

        this.startfps = fps; //frames per second, this is the speed the snake moves at
        this.init(); //initialize a snake when it's first created
        this.draw(0); // Pass 0 as realfps parameter since it's not relevant at initialization
    }

    //This is how we start a new game, we "initialize" the snake
    init() {
        this.head = { x: this.nbx / 2, y: this.nby / 2 }; //this is how the head is placed in the exact middle of the board
        this.elements = [this.head]; //We're only meant to start with one element, the head
        this.food = this.generatefood(); //when the game is started, we need food ASAP
        this.points = 0; //this will be incremented each time an apple is consumed

        //all of these have to do with speed
        this.level = 5; //we'll speed up every time we get five more points
        this.fps = this.startfps;
        this.fpsinterval = 1000 / this.fps;
        this.allowAnyDirection = true; //initially allow movement in any direction, because we only have the head
        //the game has just initialized and we don't know if the user wants to start upon loading, so we pause for now
        this.pause();
    }
    

    generatefood(nbx, nby) {
        //this will be used to determine if the apple is touching the snake, and thereby if it can be loading into that positon
        //when generatefood is first called, the apple has just been eaten, so it momentarily true
        var touch = true;
        var food = null;

        //this loop makes sure that the generated food position doesn't overlap with the snake
        while (touch) {
            food = { x: randomInteger(0, this.nbx), y: randomInteger(0, this.nby) }; //find a random coordinate for the new apple

            this.elements.every((element) => { //iterate and check every element of the snake
                if (food.x == element.x && food.y == element.y) {
                    touch = true; //it's touching, while loop and find another place
                    return false; //we don't need to continue iterating through, because we know at least one element of the snake is touching the apple, so we can't spawn it there
                }
                //if we've reached this point, there is no overlap with the elements of the snake, and we can spawn the apple in at this position
                touch = false;
                return true;
            });
        }

        return food; //when we return food, we return the position we'd like to spawn it in at
    }


    draw(realfps) {
        //set canvas background to light blue, this matches the backgrounds of the three images used for head, body, and apple.
        this.ctx.fillStyle = "#99D9EA";
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        //draw the snake and food
        this.elements.forEach((element, index) => {
            if (index === 0) {
                //draw the head:
                this.ctx.save();
                this.ctx.translate(element.x * this.eltw + this.eltw / 2, element.y * this.elth + this.elth / 2);
                //when the user changes the direction the snake is going, we need to rotate the head
                switch (this.currentDirection) {
                    case 'up':
                        this.ctx.rotate(Math.PI / 2);
                        break;
                    case 'down':
                        this.ctx.rotate(-Math.PI / 2);
                        break;
                    case 'right':
                        this.ctx.rotate(Math.PI);
                        break;
                    //no rotation needed for 'left' direction, since this is the direction it faces to begin with
                }
                this.ctx.drawImage(headImg, -this.eltw / 2, -this.elth / 2, this.eltw, this.elth);
                this.ctx.restore();
            } else {
                //draw the body:
                //since we're iterating through all elements, and we've already drawn the head, we skip it
                if (index !== 0) { //head is at index 0
                    this.ctx.drawImage(bodyImg, element.x * this.eltw, element.y * this.elth, this.eltw, this.elth);
                }
            }
        });
    
        //draw apple:
        //we access the generated food position using this.food (set by generatefood())
        this.ctx.drawImage(appleImg, this.food.x * this.eltw, this.food.y * this.elth, this.eltw, this.elth);
    
        //every time we draw, we update the points to ensure its accurate at all times
        document.getElementById("points").textContent = "Points: " + this.points;
    }
    
    

    move() {
        //Note we simulate movement by adding a head in the direction of the movement, and removing the tail

        //If the game isn't running (paused), don't move
        if (!this.gameRunning) {
            return;
        }
    
        var dirx = this.dirx;
        var diry = this.diry;
    
        //to find the new x and y positions, simple add the value of the head to the current direction
        var newx = this.head.x + dirx; 
        var newy = this.head.y + diry;
    
        //check if the new head position is outside the canvas boundaries
        //ie, it's hit a wall
        if (newx >= this.nbx || newx < 0 || newy >= this.nby || newy < 0) {
            //game over, restart the game
            console.log("Hit a wall.");
            this.freeze(); //freeze is where we stop the game and inform the user they've lost
            this.init(); //init a new snake to restart
            this.draw(0); //pass 0 as realfps parameter since it's not relevant at initialization
            return;
        }
    
        var newhead = { x: newx, y: newy }; //our head follows the new x and y given the direction
    
        // Check if the new head collides with the snake's body
        if (this.elements.some((element) => element.x === newx && element.y === newy)) {
            //game over, restart the game
            console.log("Hit the snake's body.");
            this.freeze(); //freeze is where we stop the game and inform the user they've lost
            this.init(); //init a new snake to restart
            this.draw(0); // Pass 0 as realfps parameter since it's not relevant at initialization
            return;
        }
    
        this.elements.unshift(newhead); //adds the new head to the beginning of "elements"
    
        //check if the new head collides with the food
        if (newx === this.food.x && newy === this.food.y) {
            //add a new tail, increment points, and add in a new apple
            this.food = this.generatefood(this.nbx, this.nby);
            this.points++;
            
            //speed up as as every 5 points are consumed
            if (this.points % this.level === 0) {
                this.fps++;
                this.fpsinterval = 1000 / this.fps;
            }
    
            if (this.elements.length === 1) {
                //snake is in initial state, allow movement in any direction
                this.allowAnyDirection = true;
            } else {
                //snake is beyond the initial state, revert to usual movement restrictions
                this.allowAnyDirection = false;
            }

            //note we don't remove the tail to simulate movement when we eat an apple, because we're adding an element
        } else {
            //remove last tail, simulating movement
            this.elements.pop();
        }
    
        this.head = newhead; //set the head to the new head
    
        this.draw(0); // Pass 0 as realfps parameter since it's not relevant in the move method
    }
    
    

    gameloop(timestamp) {
        //If the game isn't running (ie paused), don't proceed with the game loop
        if (!this.gameRunning) {
            return;
        }

        //calculate the number of seconds passed since the last frame
        secondspassed = (timestamp - oldtimestamp) / 1000;
        oldtimestamp = timestamp;

        //calculate fps
        realfps = Math.round(1 / secondspassed);

        //Change the direction depending on key presses
        //x only changes when moving left (-1) or right (1)
        //y only changes when moving up (1) or down (-1)
        if (this.keyup) {
            this.dirx = 0;
            this.diry = -1;
        } else if (this.keydown) {
            this.dirx = 0;
            this.diry = 1;
        } else if (this.keyleft) {
            this.dirx = -1;
            this.diry = 0;
        } else if (this.keyright) {
            this.dirx = 1;
            this.diry = 0;
        }

        now = window.performance.now();
        elapsed = now - then; //calculate time elapsed in between the two

        if (elapsed > this.fpsinterval) {
            //These are directly quoted from the logic's creator:
            //"Get ready for next frame by setting then=now, but also adjust for your
            // specified fpsInterval not being a multiple of RAF's interval"
            then = now - (elapsed % this.fpsinterval);

            this.move();
            this.draw(realfps);
        }

        var self = this;

        window.requestAnimationFrame(function (timestamp) {
            self.gameloop(timestamp);
        });
    }

    pressdown(e) {
        //This is where we adjust direction depending on keyboard input, or pause/continue the game
        //Note that there are restrictions on whether or not a user can go a certain direction to avoid them accidentally dying
        switch (e.key) {
            case "ArrowUp":
            case "w":
                if (this.allowAnyDirection || (this.diry !== 1 && this.elements.length > 1)) {
                    this.dirx = 0;
                    this.diry = -1;
                    this.currentDirection = 'up';
                }
                break;
            case "ArrowRight":
            case "d":
                if (this.allowAnyDirection || (this.dirx !== -1 && this.elements.length > 1)) {
                    this.dirx = 1;
                    this.diry = 0;
                    this.currentDirection = 'right';
                }
                break;
            case "ArrowDown":
            case "s":
                if (this.allowAnyDirection || (this.diry !== -1 && this.elements.length > 1)) {
                    this.dirx = 0;
                    this.diry = 1;
                    this.currentDirection = 'down';
                }
                break;
            case "ArrowLeft":
            case "a":
                if (this.allowAnyDirection || (this.dirx !== 1 && this.elements.length > 1)) {
                    this.dirx = -1;
                    this.diry = 0;
                    this.currentDirection = 'left';
                }
                break;
            case "Escape":
                //pause the game when "esc" is pressed
                this.pause();
                break;
            case "Enter":
                //continue/start the game when "enter" is pressed
                this.continue();
                break;
        }
    
        //start the game if it's not already running
        if (!this.gameRunning && e.key !== "Escape" && e.key !== "Enter") {
            this.gameRunning = true;
            this.gameloop(performance.now());
        }
    }
    
    
    pressup(e) {
        //this is similar to pressdown in its functionality
        switch (e.key) {
            case "ArrowUp":
            case "w":
                this.keyup = false;
                break;
            case "ArrowRight":
            case "d":
                this.keyright = false;
                break;
            case "ArrowDown":
            case "s":
                this.keydown = false;
                break;
            case "ArrowLeft":
            case "a":
                this.keyleft = false;
                break;
        }
    }

    pause() {
        //when paused, stop the game from running
        this.gameRunning = false;
    }

    continue() {
        //when unpaused (started/continue), let the game run
        if (this.gameEndedWithCollision) {
            this.init(); //start a new game
            this.gameRunning = true; //start the new game
            this.gameloop(performance.now()); //start the game loop
        } else {
            //if the game was just paused, resume it
            if (!this.gameRunning) {
                this.gameRunning = true;
                this.gameloop(performance.now());
            }
        }
    }

    freeze() {
        //freeze is called when the player dies from hitting a wall or itself

        this.gameRunning = false;
        const previousScore = this.points; //store the previous score before restarting the game
        document.getElementById("lostMessage").textContent = `You lost. You had ${previousScore} points.`; //update the message with the previous score
        document.getElementById("lostMessage").style.display = "block"; //show the "You lost!" message
        //disable event listeners to prevent accidental key presses
        document.removeEventListener("keydown", this.pressdown.bind(this));
        document.removeEventListener("keyup", this.pressup.bind(this));
    
        //add an event listener to continue the game on Enter key press
        const self = this;
        const enterListener = function (event) {
            if (event.key === "Enter" || event.key == "w" || event.key == "a" || event.key == "s" || event.key == "d" || event.key == "ArrowUp" || event.key == "ArrowDown" || event.key == "ArrowLeft" || event.key == "ArrowRight") {
                // Continue the game
                self.continue();
                // Hide the "You lost!" message
                document.getElementById("lostMessage").style.display = "none";
                // Remove the event listener
                document.removeEventListener("keydown", enterListener);
            }
        };
        document.addEventListener("keydown", enterListener);
        console.log("Froze!");
    }
    
    

}

const ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 500;

//Our new snake will have a split the canvas into 20 x 20 boxes, with an fps rate of 7 to start
var snake = new Snake(ctx, canvas.width, canvas.height, 20, 20, 7);

//We're adding all the event listeners here:
document.addEventListener("keydown", (event) => {
    snake.pressdown(event);
});

document.addEventListener("keyup", (event) => {
    snake.pressup(event);
});

const pauseButton = document.getElementById("pauseButton");
const continueButton = document.getElementById("continueButton");

pauseButton.addEventListener("click", () => {
    snake.pause();
});

continueButton.addEventListener("click", () => {
    snake.continue();
});

//To start the animation, we need to trigger the gameloop
window.requestAnimationFrame(function (timestamp) {
    then = window.performance.now();
    snake.gameloop(timestamp);
});

