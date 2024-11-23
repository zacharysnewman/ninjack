/* New Features:
- Moving Snakes
- Unlocking Doors
- Cool Animations
- Level 10 Mini Boss
- Winning
*/
// 🌲🪨💰🐍🗡🥷🚪❤️💀
let playerX, playerY, centerTile, gold, swords, currentLootTable, currentLootIndex, currentTileTable;

/* Constants */
const VERSION = "6.0";
const SNAKE = "🐍";
const ROCK = "🪨";
const TREE = "🌲";
const HOLE = "🕳️";
const CHUTE = '🪂';
const KEY = "🔑";
const LOCK = "🔒";
const UNLOCK = "🔐";
const COIN = "🪙";
const GOLD = "💰";
const GEM = "💎";
const SWORD = "🗡";
const NINJA = "🥷";
const DOOR = "🚪";
const HEART = "❤️";
const DAMAGE = "💔";
const SKULL = "💀";
const startingLevel = 0;
const maxHealth = 5;
const startingSnakesCount = 0;
const startingHeadStonesCount = 0;

/* Variables */
let currentLevel = startingLevel;
let currentHealth = maxHealth;
let currentKeys = 0;
let currentChutes = 0;
let snakesCount = startingSnakesCount;
let snakes = [];
let rocks = [];
let doorLocked = true;
let buttonsDisabled = false;

/* Alert Messages */
const alertMessages = {
	welcome: `Welcome to Ninjack ${VERSION}! A rogue-like puzzlish dungeon crawler game! Let me know if you find any bugs! And good luck!\n\nCan you escape Level 10 of the Forest?`,
	nextLevel: 'Next level!',
	death: () => `You died 💀 on Level ${currentLevel}!`,
	win: 'You win!'
};

/* World Constants */
const worldSize = 9;
const totalTiles = worldSize * worldSize;
const rockCount = 15;
const holeCount = 1;
const treeCount = totalTiles - 1 - holeCount - rockCount;

/* lootTable */
const playerCount = 1;
const swordsCount = 5;
const goldBagsCount = 7;
const gemCount = 1;

function fisherYatesShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[arr[i], arr[j]] = [arr[j], arr[i]]; 
  }
  return arr;
}

const rockTiles = Array(rockCount).fill(ROCK);
const treeTiles = Array(treeCount).fill(TREE);
const holeTiles = Array(holeCount).fill(HOLE);
const tileTable = fisherYatesShuffle([...rockTiles, ...treeTiles, ...holeTiles]);
	
function generateLootTable(chuteCount, doorCount, keyCount) {
	const remainingCount = treeCount - snakesCount - swordsCount - goldBagsCount - gemCount - doorCount - keyCount - chuteCount;
	const snakeDrops = Array(snakesCount).fill(SNAKE);
	const swordDrops = Array(swordsCount).fill(SWORD);
	const goldBagDrops = Array(goldBagsCount).fill(COIN);
	const gemDrops = Array(gemCount).fill(GEM);
	const chuteDrop = Array(chuteCount).fill(CHUTE);
	const emptyDrops = Array(remainingCount).fill('');
	const doorDrop = Array(doorCount).fill(DOOR);
	const keyDrop = Array(keyCount).fill(KEY);

	const shuffledDrops = [...fisherYatesShuffle([
		...snakeDrops,
		...swordDrops,
		...goldBagDrops,
		...gemDrops,
		...emptyDrops,
		...doorDrop,
		...keyDrop
	]), ...chuteDrop];
	
	return shuffledDrops;
}

function generateWorld() {
	rocks = [];
	const world = document.getElementById('world');
	world.innerHTML = '';
	let tileIndex = 0;
	for (let y = 0; y < worldSize; y++) {
		for (let x = 0; x < worldSize; x++) {
			const tile = document.createElement('div');
			tile.className = 'tile';

			if (x === playerX && y === playerY) {
				tile.textContent = NINJA;
				tile.classList.add(NINJA);
				centerTile = tile;
			} else {
				const tileValue = currentTileTable[tileIndex++];
				if(tileValue === ROCK) {
					rocks.push({tile,x,y});
				}
				setTile(tile, tileValue);
			}
			tile.classList.add("p" + [x,y].toString().replace(",", "-"));
			world.appendChild(tile);
		}
	}
}

function updateGoldDisplay() {
	const goldDisplay = document.getElementById('goldDisplay');
	const chutesText = currentChutes > 0 ? ` 🪂${currentChutes}` : '';
	goldDisplay.textContent = `🚪${currentLevel} ❤️${currentHealth} 🔑${currentKeys} 🗡${swords} 💰${gold}${chutesText}`;
}
		
function hasClass(tile, className) {
	return tile.classList.contains(className);
}

function removeClass(tile, className) {
	return tile.classList.remove(className);
}

function removeClasses(tile, classNames) {
	for(const className of classNames) {
		removeClass(tile, className);
	}
}

function setTile(tile, className) {
	if(className !== '') {
		tile.classList.add(className);
	}
	tile.textContent = className;
}

function endGame() {
	resetGame(false);
}

function getNewTileInDirection(direction, startX, startY) {
  	let newX = startX;
	let newY = startY;
	
	switch (direction) {
		case 'up':
			newY = Math.max(0, startY - 1);
		break;
		case 'down':
			newY = Math.min(worldSize - 1, startY + 1);
		break;
		case 'left':
			newX = Math.max(0, startX - 1);
		break;
		case 'right':
			newX = Math.min(worldSize - 1, startX + 1);
		break;
	}
	
	const newTile = document.querySelector(`.tile:nth-child(${newY * worldSize + newX + 1})`);

	return { newTile, newX, newY };
}

function getRandomDirection() {
	const directions = ['up', 'down', 'left', 'right'];
	const randomIndex = Math.floor(Math.random() * directions.length);
	const randomDirection = directions[randomIndex];
	
	return randomDirection;
}

function canSnakeMoveToTile(tile, x, y) {
	const blockingClasses = [TREE, ROCK, SNAKE, DOOR, KEY, CHUTE];
	const isBlocking = blockingClasses.some(className => hasClass(tile, className));

	return !isBlocking;
}

function snakeMove(snake, oldTile, newTile, newX, newY) {
	if(!oldTile || !newTile) {
	const text = !oldTile ? "oldTile" : "newTile";
		console.log("No tile: " + text);
		return;
	}
	
	if(snake.justSpawned) {
		snake.justSpawned = false;
		return;
	}
	
	if(canSnakeMoveToTile(newTile, newX, newY)) {
		removeClass(oldTile, SNAKE);
		setTile(oldTile, '');
		const isHole = hasClass(newTile, HOLE);
		const isPlayer = hasClass(newTile, NINJA);
		const shouldDie =  isHole || (isPlayer && currentHealth > 1);
		
		if(hasClass(newTile, NINJA)) {
			if(currentHealth <= 1) {
				notify(SKULL, newTile);
			}
			handleDamage(1, newTile);
		}
		
		if(shouldDie) {
			killSnake(snake.x, snake.y);
			notify(SKULL, isHole ? newTile : oldTile);
		} else {
			setTile(newTile, SNAKE);
			removeClasses(newTile, [GOLD, SWORD, HEART, COIN, GEM]);
			snake.x = newX;
			snake.y = newY;
		}
	}
}

function killSnake(x, y) {
	snakes = snakes.filter(snake => !(snake.x === x && snake.y === y));
}

function addSnake(x, y) {
	snakes.push({ x, y, justSpawned: true });
}

function moveSnakes() {
	for(const snake of snakes) {
		const direction = getRandomDirection();
		const selector = "p" + [snake.x, snake.y].toString().replace(",", "-");
		const tile = document.getElementsByClassName(selector)[0];
		const { newTile, newX, newY } = getNewTileInDirection(direction, snake.x, snake.y);
		snakeMove(snake, tile, newTile, newX, newY);
	}
}

function notify(emoji, targetElement) {
  const container = document.getElementById('notification-container');

  // Get the position and size of the target element (tile)
  const rect = targetElement.getBoundingClientRect();

  // Create the emoji element
  const emojiElement = document.createElement('div');
  emojiElement.textContent = emoji;
  emojiElement.classList.add('emoji-notification');

  // Set the size of the emoji to match the target tile
  emojiElement.style.width = `${rect.width}px`;
  emojiElement.style.height = `${rect.height}px`;
  emojiElement.style.fontSize = `${rect.height * 0.8}px`; // Adjust font size to fit inside the tile
  emojiElement.style.lineHeight = `${rect.height}px`; // Center vertically

  // Temporarily append to calculate the emoji's size
  container.appendChild(emojiElement);
  const emojiRect = emojiElement.getBoundingClientRect();

  // Adjust position to center over the target element
  const x = rect.left + rect.width / 2 - emojiRect.width / 2;
  const y = rect.top + rect.height / 2 - emojiRect.height / 2;

  // Set final position
  emojiElement.style.left = `${x}px`;
  emojiElement.style.top = `${y}px`;

  // Remove the element after the animation is complete
  emojiElement.addEventListener('animationend', () => {
	emojiElement.remove();
  });
}

function getRandomInRange(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function disableButtons() {
	const buttons = document.querySelectorAll('button'); // Select all buttons
	buttons.forEach(button => {
		button.disabled = true; // Disable each button
	});
	buttonsDisabled = true;
}

function enableButtons() {
	const buttons = document.querySelectorAll('button'); // Select all buttons
	buttons.forEach(button => {
		button.disabled = false; // Disable each button
	});
	buttonsDisabled = false;
}

function move(direction) {
	const currentTile = document.querySelector(`.tile.${NINJA}`);
	let shouldEndGame = false;
	const { newTile, newX, newY } = getNewTileInDirection(direction, playerX, playerY);
	
	if(hasClass(newTile, HOLE)) {
		if(currentChutes > 0) {
			setTile(currentTile, '');
			removeClass(currentTile, NINJA);
			notify(CHUTE, newTile);
			handleWin();
		} else {
		   	notify(SKULL, newTile);
			handleDamage(currentHealth, currentTile);
		}
		return;
	} else if (hasClass(newTile, TREE) ||hasClass(newTile, ROCK)) {
		isRock = hasClass(newTile, ROCK);
		removeClass(newTile, TREE);
		removeClass(newTile, ROCK);
		
		const revealedTile = isRock ? SNAKE : currentLootTable[currentLootIndex++];
		if(revealedTile === SNAKE) {
			addSnake(newX, newY);
		}
		setTile(newTile, revealedTile);
		notify(isRock ? ROCK : TREE, newTile);
	} else if(hasClass(newTile, DOOR)) {
		if(doorLocked) {
			if(currentKeys > 0) {
				currentKeys = 0;
				updateGoldDisplay();
				doorLocked = false;
				notify(UNLOCK, newTile);
			} else {
				notify(LOCK, newTile);
			}
			return;
		}
		
		currentTile.textContent = '';
		removeClass(currentTile, NINJA);

		playerX = newX;
		playerY = newY;

		newTile.textContent = NINJA;
		newTile.classList.add(NINJA);
		notify(DOOR, newTile);
		endGame();
		return;
	} else {
		if (hasClass(newTile, GOLD)) {
			const goldAmount = 5;
			gold += goldAmount;
			updateGoldDisplay();
			newTile.textContent = '';
			removeClass(newTile, GOLD);
			notify(GOLD, newTile);
		} else if (hasClass(newTile, COIN)) {
			const goldAmount = 1;
			gold += goldAmount;
			updateGoldDisplay();
			newTile.textContent = '';
			removeClass(newTile, COIN);
			notify(COIN, newTile);
		} else if (hasClass(newTile, GEM)) {
			const goldAmount = 10;
			gold += goldAmount;
			updateGoldDisplay();
			newTile.textContent = '';
			removeClass(newTile, GEM);
			notify(GEM, newTile);
		} else if(hasClass(newTile, SWORD)) {
			swords++;
			updateGoldDisplay();
			newTile.textContent = '';
			removeClass(newTile, SWORD);
			notify(SWORD, newTile);
		} else if(hasClass(newTile, HEART)) {
			currentHealth += 1;
			updateGoldDisplay();
			newTile.textContent = '';
			removeClass(newTile, HEART);
			notify(HEART, newTile);
		} else if(hasClass(newTile, KEY)) {
			currentKeys = 1;
			updateGoldDisplay();
			newTile.textContent = '';
			removeClass(newTile, KEY);
			notify(KEY, newTile);
		} else if(hasClass(newTile, CHUTE)) {
			currentChutes = 1;
			updateGoldDisplay();
			newTile.textContent = '';
			removeClass(newTile, CHUTE);
			notify(CHUTE, newTile);
			handleFinalBoss();
		} else if(hasClass(newTile, SNAKE)) {
			if(swords > 0 || currentHealth > 1) {
				setTile(newTile, '');
				removeClass(newTile, SNAKE);
				notify(SKULL, newTile);
				killSnake(newX, newY);
			} else {
				notify(SKULL, currentTile);
			}
			
			if(swords > 0) {
				const isHeart = getRandomInRange(1, 100) > 80;
				const lootDrop = isHeart ? HEART : GOLD;
				setTile(newTile, lootDrop);
				swords--;
				updateGoldDisplay();
				notify(SWORD, currentTile);
				notify(SKULL, newTile);
				return;
			} else {
				handleDamage(1, currentTile);
			 	return;
			}
		}
		
		currentTile.textContent = '';
		removeClass(currentTile, NINJA);

		playerX = newX;
		playerY = newY;
		
		newTile.textContent = NINJA;
		newTile.classList.add(NINJA);
	}
	
	moveSnakes();
}

function handleDamage(damage, currentTile) {
  	currentHealth -= damage;
  	updateGoldDisplay();
				
	if(currentHealth <= 0) {
		handleDeath(currentTile);
	} else {
		notify(DAMAGE, currentTile);
	}
}

function handleDeath(currentTile) {
	setTile(currentTile, '');
	removeClass(currentTile, NINJA);

	const delay = 1000;
	disableButtons();
	setTimeout(() => {
		confirm(alertMessages.death());
		resetGame();
		enableButtons();
	}, delay);
}

function handleFinalBoss() {
	rocks.forEach(rock => {
		removeClass(rock.tile, ROCK);
		notify(ROCK, rock.tile);
 		setTile(rock.tile, SNAKE);
 		addSnake(rock.x, rock.y);
	});
}

function handleWin() {
	const delay = 1000;
	disableButtons();
	setTimeout(() => {
		confirm(alertMessages.win);
		resetGame();
		enableButtons();
	}, delay);
}

function resetGame(newGame = true) {
	let introText;
	let chuteCount = 0;
	let doorCount = 1;
	let keyCount = 1;
	
	if(newGame) {
		playerX = Math.floor(worldSize / 2);
		playerY = Math.floor(worldSize / 2);
		gold = 0;
		swords = 0;
		currentHealth = maxHealth;
		currentLevel = startingLevel;
		currentChutes = 0;
		snakesCount = startingSnakesCount;
	} else {
		snakesCount += 1;
		if(currentLevel === 9) {
			chuteCount = 1;
			doorCount = 0;
			keyCount = 0;
		}
	}
	
	snakes = [];
	currentKeys = 0;
	doorLocked = true;

	currentLootIndex = 0;
	currentLootTable = generateLootTable(chuteCount, doorCount, keyCount);
	currentTileTable = fisherYatesShuffle([...tileTable]);
	generateWorld();
	currentLevel += 1;
	updateGoldDisplay();
}

const onKeyDown = (event) => {
	if(buttonsDisabled) {
		return;
	}
	
	switch (event.key) {
		case 'ArrowUp': // Up arrow key
			move('up');
			break;
		case 'ArrowLeft': // Left arrow key
			move('left');
			break;
		case 'ArrowRight': // Right arrow key
			move('right');
			break;
		case 'ArrowDown': // Down arrow key
			move('down');
			break;
	}
};

function main() {
	document.addEventListener('keydown', onKeyDown);
	let lastTouchTime = 0;

document.addEventListener('touchend', (e) => {
  const now = new Date().getTime();
  if (now - lastTouchTime <= 300) {
    e.preventDefault(); // Prevent double-tap-to-zoom
  }
  lastTouchTime = now;
});
	resetGame();
	alert(alertMessages.welcome);
}

main();







