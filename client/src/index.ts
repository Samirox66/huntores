import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';

// custom scene class
export class GameScene extends Phaser.Scene {
  room: Room;

  playerEntities: { [sessionId: string]: any } = {};

  inputPayload = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;

  preload() {
    // preload scene
    this.load.image(
      'ship_0001',
      'https://cdn.glitch.global/3e033dcd-d5be-4db4-99e8-086ae90969ec/ship_0001.png'
    );
    this.cursorKeys = this.input.keyboard.createCursorKeys();
  }

  async create() {
    console.log('joining room...');
    const client = new Client('ws://nmuus1.colyseus.de');
    try {
      console.log('Trying to join or to create');
      this.room = await client.joinOrCreate('my_room');
      console.log('Joined successfully!');
    } catch (e) {
      console.error(e);
    }

    this.room.state.players.onAdd = (player, sessionId) => {
      //
      // A player has joined!
      //
      const entity = this.physics.add.image(player.x, player.y, 'ship_0001');

      // keep a reference of it on `playerEntities`
      this.playerEntities[sessionId] = entity;

      player.onChange = () => {
        // update local position immediately
        entity.x = player.x;
        entity.y = player.y;
      };

      console.log('A player has joined! Their unique session id is', sessionId);
    };

    this.room.state.players.onRemove = (player, sessionId) => {
      const entity = this.playerEntities[sessionId];
      if (entity) {
        // destroy entity
        entity.destroy();

        // clear local reference
        delete this.playerEntities[sessionId];
      }
    };
  }

  update(time: number, delta: number): void {
    // game loop
    if (!this.room) {
      return;
    }

    this.inputPayload.left =
      this.cursorKeys.left.isDown || this.input.keyboard.addKey('A').isDown;
    this.inputPayload.right =
      this.cursorKeys.right.isDown || this.input.keyboard.addKey('D').isDown;
    this.inputPayload.up =
      this.cursorKeys.up.isDown || this.input.keyboard.addKey('W').isDown;
    this.inputPayload.down =
      this.cursorKeys.down.isDown || this.input.keyboard.addKey('S').isDown;
    this.room.send(0, this.inputPayload);
  }
}

// game config
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#b6d53c',
  parent: 'phaser-example',
  physics: { default: 'arcade' },
  pixelArt: true,
  scene: [GameScene],
};

// instantiate the game
const game = new Phaser.Game(config);
