class Court{
    constructor(gameData, players, teams) {
        this.gameData = gameData;
        this.players = players;
        this.teams = teams;

        this.svg = d3.select('#court').append('svg');
        this.courtBounds = d3.select('.court').node().getBoundingClientRect();
        this.courtWidth = this.courtBounds.width;
        this.courtHeight = this.courtBounds.height;
        this.svg
            .attr('width',this.courtWidth)
            .attr('height',this.courtHeight)
            .attr('transform','translate(-' + this.courtWidth + ',0)')

        this.svg.append('text').attr('id','eventId')
            .attr('x', this.courtWidth / 2)
            .attr('y', 25)
            .attr('text-anchor','middle')
            .text('eventId')
        this.svg.append('text').attr('id','gameClock')
            .attr('x', this.courtWidth / 4)
            .attr('y', 25)
            .attr('text-anchor','middle')
            .text('Time Remaining')

        this.xMin = 0;
        this.xMax = 100;
        this.yMin = 0;
        this.yMax = 50;

        this.events = this.gameData.events;
        this.event = 0;
        this.moments = this.events[this.event].moments.map(a => a[5]);
        this.moment = 0;
        this.xScale;
        this.yScale;
    }

    drawPlayers() {

        //let positionData = this.gameData.events.map(a => a.moments.map(b => b['5']))
        //let xVals = test[0].map(a => a.map(b => b[2]))
        //let yteVals = test[0].map(a => a.map(b => b[2]))
        //Take the max value from an array of the max values of each player at each moment.
        //Math.max(...xVals.map(a => Math.max(...a)))
        //Math.max(...test.map(event => Math.max(...event.map(moment => moment.map(player => player[2])).map(playerPos => Math.max(...playerPos)))))

        let courtX = this.courtWidth / 15;
        let courtY = this.courtHeight / 11;

        this.xScale = d3.scaleLinear()
                        .domain([this.xMin,this.xMax])
                        .range([0 + courtX, this.courtWidth - courtX])

        this.yScale = d3.scaleLinear()
                        .domain([this.yMin,this.yMax])
                        .range([0 + courtY, this.courtHeight - courtY])

        let teamA = this.moments[this.moment][1][0];

        let players = this.svg.selectAll('circle').data(this.moments[0]);
        let playersEnter = players.enter().append('circle');
        players.exit().remove();
        players = playersEnter.merge(players);
        players
            .attr('cx', (d,i) => this.xScale(i * 2))
            .attr('cy',  (d,i) => this.yScale(i * 2))
            .attr('r',d => d[0] == -1 ? 10 : 15)
            .attr('fill', d => d[0] == -1 ? '#C00': 
                               (d[0] == teamA ? '#060' : '#006'));
        d3.select('#eventId').text("Event" + this.event);
    }

    update() {
        if (this.moment > this.moments.length - 1) {
            console.log('Moments exhausted')
            this.loadEvent();
            return;
        }
        /* console.log("Updating to Moments: " + this.moment); */
        /* console.log('Data value for x = ' + that.moments[i][1][2] + '; scaled value = ' + this.xScale(that.moments[i][1][2])) */
        
        let players = this.svg.selectAll('circle')
        players.data(this.moments[this.moment])
            .attr('cx', d => this.xScale(d[2]))
            .attr('cy', d => this.yScale(d[3]));
        
        d3.select('#gameClock').text("Time Remaining: " + this.events[this.event].moments[this.moment]['2']);

       console.log('Event ' + this.event + ': ' + this.moment + ' of ' + this.moments.length)
        this.moment++;
    }

    loadEvent() {
        this.event++;
        d3.select('#eventId').text("Event " + this.event);
        if (this.event > this.events.length - 1) return;

        this.moments = this.events.map(a => a.moments.map(b => b['5']))[this.event];
        this.moment = 0;
    }
    

}