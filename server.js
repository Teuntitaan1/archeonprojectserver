// the http module handles the server part of this file, it can process http requests
const http = require("http");
const { MongoClient, ServerApiVersion } = require('mongodb');
const host = 'localhost';
const port = process.env.port || 8000;
//
//
//

const uri = "mongodb+srv://TeunWeijdener:zleGG3AycjJvSdyg@archeon-leaderboard.pkxjk0s.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

var DebugOn = false;

function GetRequest(request, response) {
    // header stuff which i know next to nothing about, i do know that the setheader function works like a dictionary
    response.setHeader("Content-Type", "text/plain");
    // writehead is the http response the client should recieve
    response.writeHead(200);
    // end is the actual response the client recieves
    client.connect(err => {
        // gets the leaderboard
        const UnorderedLeaderboard = client.db("Archeon-Leaderboard").collection("Leaderboard");
        console.log(UnorderedLeaderboard);
        client.close();

        var OrderedLeaderboard = [];

        // not my code, sorted by score value
        OrderedLeaderboard = UnorderedLeaderboard.sort((a,b) => b.TotalPoints - a.TotalPoints);
        // adds a position to the user to be displayed on the leaderboard
        for (let index = 0; index < OrderedLeaderboard.length; index++) {
            // makes the usernames shorter
            if (OrderedLeaderboard[index].UserName.length > 10) {
                OrderedLeaderboard[index].UserName = OrderedLeaderboard[index].UserName.slice(0, 10) + "...";
            }
            OrderedLeaderboard[index].Position = index+1;
        }
        if (DebugOn) {
            console.log("SEND DATA: ");
            console.table(OrderedLeaderboard);
        }
    
        response.end(JSON.stringify(OrderedLeaderboard));
      })
}

function PostRequest(request, response) {
    
    // keeps on reading data until no more is coming
    var Data = null;
    const chunks = [];
    request.on("data", (chunk) => {
      chunks.push(chunk);
    });
    request.on("end", () => {
      Data = JSON.parse(Buffer.concat(chunks));
      
      if (DebugOn) {
        console.log(`RECEIVED DATA:`);
        console.table(Data);
      }
      //append data to database
      client.insertOne(Data);
    });

    response.setHeader("Content-Type", "text/plain");

    // http code OK
    response.writeHead(200);

    // write the actual response.
    response.end();
}

// function that listens for request and handles them accordingly
const requestListener = function (request, response) {

    if (DebugOn) {
        console.log(`[${new Date().toLocaleString()}] || ${request.method} FROM ${request.socket.remoteAddress}`); // type of request + ip adress
    }

    response.setHeader("Access-Control-Allow-Origin", "*");


    switch (request.method) {
        
        case "GET":
            GetRequest(request, response);
            break;
        case "POST":
            PostRequest(request, response);
            break;

        default:
            response.setHeader("Content-Type", "text/plain");
            response.writeHead(500);
            response.end("This function is not implemented");
            break;
    }
};
//
//
//
//
// creates the server
const server = http.createServer(requestListener);
// keeps the server up and running
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
    console.log(`Server started on ${new Date().toLocaleString()}`);
});