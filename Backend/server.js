import fetch from "node-fetch"
import express from "express"
import http from "http"
import {WebSocketServer} from "ws"
import dotenv from "dotenv"
import fs from "fs"

dotenv.config()

//Express startup
const app = express()

//HTTP server
const server = http.createServer(app)

//WebSocket server
const wss = new WebSocketServer({server})

async function fetchTrainData() {
    const url = "https://api.wmata.com/TrainPositions/TrainPositions?contentType=json"

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache',
            'api_key': process.env.API_KEY
        }
    })

    const data = await res.text()

    const json = JSON.parse(data)

    return json
}

setInterval(async () => {
    const data = await fetchTrainData()

    const trains = data["TrainPositions"]

    const grouped = trains.reduce((acc, train) => {
        const line = train["LineCode"]

        if (!acc[line]) acc[line] = [];
        acc[line].push(train);

        return acc;
    }, {})

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(grouped))
        }
    })
}, 5000)

server.listen(8080, () => {
    console.log("HTTP server has started.")
})