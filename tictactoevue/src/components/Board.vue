<template>
    <div class="component">
        <h3 v-if="game">Game id: {{game.id}}</h3>
        
 <div class="board" id="board">
        <div @click="move(0,0)" v-bind:class="'cell ' + cells[0][0]" data-cell></div>
        <div @click="move(1,0)" v-bind:class="'cell ' + cells[1][0]" data-cell></div>
        <div @click="move(2,0)" v-bind:class="'cell ' + cells[2][0]" data-cell></div>
        <div @click="move(0,1)" v-bind:class="'cell ' + cells[0][1]" data-cell></div>
        <div @click="move(1,1)" v-bind:class="'cell ' + cells[1][1]" data-cell></div>
        <div @click="move(2,1)" v-bind:class="'cell ' + cells[2][1]" data-cell></div>
        <div @click="move(0,2)" v-bind:class="'cell ' + cells[0][2]" data-cell></div>
        <div @click="move(1,2)" v-bind:class="'cell ' + cells[1][2]" data-cell></div>
        <div @click="move(2,2)" v-bind:class="'cell ' + cells[2][2]" data-cell></div>
    </div>


        <div v-if="winner" class="end-message" id="end-message">
        <div data-end-message-text v-if="winner === 'draw'">Draw!</div>
        <div data-end-message-text v-if="winner === 'o' || winner === 'x'">{{winner}}'s Wins! 🥳</div>
        <button @click="restart" id="restartButton">Restart</button>
        </div>
    </div>
</template>

<script>
import {ref, computed, onBeforeUnmount, onUnmounted, watchEffect} from 'vue'
import { defineComponent } from '@vue/composition-api'
import { DataStore, Auth } from 'aws-amplify'

import { Game } from '../models'

function checkWin(cells) {
  const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
    const [a, b, c] = WINNING_COMBINATIONS[i];
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a];
    }
        else if(!cells.includes('')){
        return 'draw';
    }
  }
  return null;
}

export default defineComponent({
    
    setup() {
        const player = ref('x')
        const cells = ref([
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ])
        const winner = computed(() => checkWin(cells.value.flat()))
        const game = ref(undefined)
        const userData = ref(undefined)

        const move = async (x, y) => {
            if (winner.value) return
            if (cells.value[x][y] !== '') return 
            if (game.value.currentPlayer !== (player.value).toUpperCase()) return

            cells.value[x][y] = player.value
            //game.value.map = JSON.stringify(cells.value)

            
            if (game.value && game.map !== JSON.stringify(cells.value) ){
                console.log("game updated")
                console.log(game.value)
                console.log(JSON.stringify(cells.value))

                await DataStore.save(Game.copyOf(game.value, g => {
                    g.map = JSON.stringify(cells.value);
                    g.currentPlayer = game.value.currentPlayer === 'X' ? 'O' : 'X';
                    })
                );
            }
            
            
            //player.value = player.value === 'x' ? 'o' : 'x'
        }


        const restart = () => {
        cells.value = [
            ['','',''],
            ['','',''],
            ['','','']
        ]
        //setGame(undefined)
        }



        const searchOrCreateOnlineGame = async () => {
        //search for games with a slot available
        const games = await getAvailableGames()
        if (games.length > 0)
        {
            await joinGame(games[0])
        }
        //if no games found, create a new one
        else
        {
           await createNewGame()   
        }
        
        }

        const createNewGame = async () => {
            const emptyGameCells = JSON.stringify([
            ['','',''],
            ['','',''],
            ['','','']
            ])
            const newGame = new Game({
                playerX: userData.value.attributes.sub,
                playerO: "",
                map: emptyGameCells,
                currentPlayer: 'X',
            })

            const createdGame = await DataStore.save(newGame)
            player.value='x'
            console.log(newGame)
            setGame(createdGame)
        }

        const joinGame = async (gameJoined) => {
            const updatedGame = await DataStore.save(Game.copyOf(gameJoined, (updatedGame) => {
                updatedGame.playerO = userData.value.attributes.sub
            }))
            player.value='o'
            setGame(updatedGame)
            console.log(`joining ${game.value.id}`)
        }

        const getAvailableGames = async () => {
            const games = await DataStore.query(Game, (g) => g.playerO("eq", ""))
            return games
        }

        const observeGame = () => {
            if (game.value){
                console.log(game.value.id)
                const subscription = DataStore.observe(Game, game.value.id).subscribe((msg) => {
                    console.log(msg.model, msg.opType, msg.element)
                    const newGame = msg.element
                    if(msg.opType == "UPDATE")
                    {
                        console.log('UPDATE')
                        console.log(JSON.parse(msg.element.map))
                        setGame(newGame)
                        if(newGame.map){
                            cells.value = JSON.parse(newGame.map)
                        }
                    }
                })
                return () => subscription.unsubscribe()
            }
        }

        const setGame = (createdGame) => {
            game.value = createdGame
        }

        const setUserData = async () => {
            userData.value = await Auth.currentAuthenticatedUser()
        }

        const deleteGame = async () => {
            if (!game.value || game.playerO)
            {
                return
            }
            else
            {
                await DataStore.delete(Game, game.value.id)
                setGame(null)
            }
            
        }
        const leaving = async () => {
            await deleteGame()
            alert("Leaving")
            console.log("Leaving")
        }

        

        window.addEventListener('beforeunload', leaving)
        onBeforeUnmount(deleteGame())
        onUnmounted(deleteGame)
        setUserData()
        searchOrCreateOnlineGame()
        
        watchEffect(() => observeGame())
        watchEffect(() => observeGame())
        
        
        return {winner, player, cells, move, restart, game, deleteGame}
    }
})
</script>


<style>
:root{
    --cell-size: 100px;
    --mark-size: calc(var(--cell-size)*.9);
}

.board{
    width: 100vw;
    height: 100vh;
    display: grid;
    justify-content: center;
    align-content: center;
    justify-items: center;
    align-items: center;
    grid-template-columns: repeat(3, auto);
}

.cell{
    width: var(--mark-size);
    height: var(--mark-size);
    border: 1px solid black;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
}

.cell.x::before,
.cell.x::after,
.board.x .cell:not(.x):not(.o):hover::before,
.board.x .cell:not(.x):not(.o):hover::after{
    content: '';
    position: absolute;
    width: calc(var(--mark-size)*.15);
    height: calc(var(--mark-size));
    background-color: black;
}

.cell.x::before,
.board.x .cell:not(.x):not(.o):hover::before{
    transform: rotate(45deg);
}

.cell.x::after,
.board.x .cell:not(.x):not(.o):hover::after{
    transform: rotate(-45deg);
}

.cell.o::before,
.cell.o::after,
.board.o .cell:not(.x):not(.o):hover::before,
.board.o .cell:not(.x):not(.o):hover::after{
    content: '';
    position: absolute;
    border-radius: 50%;
    background-color: black;
}

.cell.o::before,
.board.o .cell:not(.x):not(.o):hover::before{
    width: var(--mark-size);
    height: var(--mark-size);
}

.cell.o::after,
.board.o .cell:not(.x):not(.o):hover::after{
    width: calc(var(--mark-size)*.75);
    height: calc(var(--mark-size)*.75);
    background-color: white;
}

.cell.x,
.cell.o{
    cursor: not-allowed;
}

.board.x .cell:not(.x):not(.o):hover,
.board.o .cell:not(.x):not(.o):hover{
    opacity: 50%;
}


.end-message{
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    justify-content: center;
    align-items: center;
    color: white;
    display: flex;
    font-size: 5rem;
    flex-direction: column;
}

.end-message button{
    font-size: 3rem;
    background-color: white;
    border: 1px solid black;
    padding: .25em .5em;
    cursor: pointer;
}

.end-message button:hover{
    color: white;
    background-color: black;
    border: 1px solid white;
    cursor: pointer;
}

</style>