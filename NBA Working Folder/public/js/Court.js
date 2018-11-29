class Court{
    constructor(gameData, players, teams, teamDisplays, playbyplay, playerDisplays) {
		this.gameData = gameData;
		this.playbyplay = playbyplay;
		this.curPlay = 0;
		this.score = " 0 - 0";
        this.players = players;
        this.teams = teams;
		this.teamDisplays = teamDisplays;
		this.playerDisplays = playerDisplays;
		this.coloredPlayers = [];
        
        this.courtBounds = d3.select('.courtPNG').node().getBoundingClientRect();

        this.courtWidth = this.courtBounds.width;
        this.courtHeight = this.courtBounds.height;
        this.scaleEffect = this.courtWidth > 950 ? 4 : (this.courtWidth > 750 ? 2 : 0);
        this.svg = d3.select('.court').select('.overlay')
        this.svg
            .attr('width',this.courtWidth)
            .attr('height',this.courtHeight)
            //.attr('transform','translate(-' + this.courtWidth + ',0)')
            .attr('transform','translate(0,' + -this.courtHeight+ ')')

        this.svg.append('text').attr('id','eventId')
            .attr('x', 3 * this.courtWidth / 4)
            .attr('y', 25)
            .attr('text-anchor','middle')
			.text('eventId')
		this.svg.append('text').attr('id', 'score')
			.attr('x', this.courtWidth / 2)
			.attr('y', 35)
			.attr('text-anchor', 'middle')
			.attr('font-size', '50px')
			.text('0 - 0')
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
		this.moments = this.events[this.event].moments.map(a => a[4]);
		if (localStorage["curMoment"])
			this.moment = localStorage["curMoment"];
		else
			this.moment = 0;
        this.xScale;
        this.yScale;
        this.rScale;
		this.curHeatmap;
        this.dropShadow();
    }

    drawPlayers() {

        //let positionData = this.gameData.events.map(a => a.moments.map(b => b['5']))
        //let xVals = test[0].map(a => a.map(b => b[2]))
        //let yteVals = test[0].map(a => a.map(b => b[2]))
        //Take the max value from an array of the max values of each player at each moment.
        //Math.max(...xVals.map(a => Math.max(...a)))
        //Math.max(...test.map(event => Math.max(...event.map(moment => moment.map(player => player[2])).map(playerPos => Math.max(...playerPos)))))

		this.curHeatmap = this.moments[0];

        let courtX = this.courtWidth / 16;
        let courtY = this.courtHeight / 11;

        this.xScale = d3.scaleLinear()
                        .domain([this.xMin,this.xMax])
                        .range([0 + courtX, this.courtWidth])

        
        this.yScale = d3.scaleLinear()
                        .domain([this.yMin,this.yMax])
                        .range([0 + courtY, this.courtHeight - courtY])

        this.rScale = d3.scaleLinear()
                        .domain([0,18])
                        .range([4 + this.scaleEffect, 16 + this.scaleEffect])

        this.svg.append('rect')
            .attr('x', this.xScale(0) - 2)
            .attr('y', this.yScale(this.yMax / 2)-2)
            .attr('height', 4)
            .attr('width', 4);

        this.svg.append('rect')
            .attr('x', this.xScale(this.xMax) - 2)
            .attr('y', this.yScale(this.yMax / 2)-2)
            .attr('height', 4)
            .attr('width', 4);

        let teamA = this.teams['htm'].teamid

        let players = this.svg.selectAll('circle').data(this.moments[0]);
        let playersEnter = players.enter().append('circle');
        players.exit().remove();
        players = playersEnter.merge(players);
        players
            .attr('cx', (d,i) => this.xScale(i * 2))
            .attr('cy',  (d,i) => this.yScale(i * 2))
            .attr('r',d => d[0] == -1 ? this.rScale(d[4]) : (12 + this.scaleEffect))
            .attr('class', d => d[0] == -1 ? 'ball': 
                               (d[0] == teamA ? 'GSW' : 'UTA'))
            .style("filter", "url(#drop-shadow)");

        d3.select('#eventId').text("Event" + this.event);

        console.log(this.moments[0].map(a => a[1]).slice(1,11));
        let activePlayerList = this.moments[0].map(a => a[1]).slice(1,11);
        this.teamDisplays.updateActivePlayers(activePlayerList)
        this.teamDisplays.linkToCourt(this);
	}

	heatmapColor(data) {
		for (let i = 0; i < this.coloredPlayers.length; i++) {
			if (this.coloredPlayers[i][0] == data[1]) {
				return this.coloredPlayers[i][1];
			}
		}
		return 'transparent';
	}

    update() {
        if (this.moment > this.moments.length - 1) {
            console.log('Moments exhausted')
            this.loadEvent();
            return;
		}

		//Update Passing display
		if (this.playerDisplays != null) {
			let curPossession = -1;
			for (let i = 0; i < this.moments[this.moment].length; i++) {
				if (this.moments[this.moment][i][5] == 1) {
					curPossession = this.moments[this.moment][i][1];
					break;
				}
			}
			this.playerDisplays.addPossession(curPossession);
		}

		//Update Score
		if (this.curTime <= this.playbyplay[this.curPlay][6]) {
			if (this.playbyplay[this.curPlay][10] != null) {
				this.score = this.playbyplay[this.curPlay][10];
				this.playerDisplays.resetPlay();
			}
			this.teamPossession = this.playbyplay;
			this.curPlay += 1;
		}

		//TODO: The heatmap should be moved to its own type of view, it's too laggy for realtime
		this.curHeatmap = this.curHeatmap.concat(this.moments[this.moment]);
		let heatmapSquares = [];
		if (this.coloredPlayers.length == 0) {
			heatmapSquares = this.svg.selectAll('rect').data([]);
		}
		else {
			heatmapSquares = this.svg.selectAll('rect').data(this.curHeatmap);
		}
		heatmapSquares.exit().remove();
		heatmapSquares.enter().append('rect')
			.attr('x', d => this.xScale(d[2]))
			.attr('y', d => {
				return this.yScale(d[3]);
			})
			.attr('width', 1)
			.attr('height', 1)
			.attr('class',  d => 'name' + d[1])
			.attr('fill', d => this.heatmapColor(d));
		
        let players = this.svg.selectAll('circle')
        players.data(this.moments[this.moment])
            .attr('cx', d => this.xScale(d[2]))
            .attr('cy', d => this.yScale(d[3]))
            .attr('r',d => d[0] == -1 ? this.rScale(d[4]) : (12 + (d[5] * 5) + this.scaleEffect))
            .style("filter", d => d[0] == -1 ? '' : "url(#drop-shadow)");
		this.curTime = Math.floor(this.events[this.event].moments[this.moment]['1'] / 60) + ':' + (this.events[this.event].moments[this.moment]['1'] % 60).toFixed(0);
		d3.select('#gameClock').text("Time Remaining: " + this.curTime);
		// Add scores
		d3.select('#score').text(this.score);
		localStorage["curMoment"] = this.moment;
        this.moment++;
    }


    loadEvent() {
        this.event++;
        console.log('Loading event ' + this.event);
        d3.select('#eventId').text("Event " + this.event);
        if (this.event > this.events.length - 1) {
            console.log('reached the end of the events');
            return;
        }

        this.moments = this.events.map(a => a.moments.map(b => b['4']))[this.event];
        this.moment = 0;
	}

	selectPlayer(playerid, color) {
		this.coloredPlayers.push([playerid, color]);
		this.svg.selectAll('.name' + playerid).attr('fill', color);
	}

	removePlayer(playerid) {
		this.svg.selectAll('.name' + playerid).attr('fill', 'transparent');
		for (let i = 0; i < this.coloredPlayers.length; i++) {
			if (this.coloredPlayers[i][0] === playerid) {
				this.coloredPlayers.splice(i, 1);
				return;
			}
		}
	}

    dropShadow() {
        let defs = this.svg.append('defs');

        // create filter with id #drop-shadow
        // height=130% so that the shadow is not clipped
        let filter = defs.append('filter')
            .attr('id', 'drop-shadow')
            .attr('height', '130%');

        // SourceAlpha refers to opacity of graphic that this filter will be applied to
        // convolve that with a Gaussian with standard deviation 3 and store result
        // in blur
        filter.append('feGaussianBlur')
            .attr('in', 'SourceAlpha')
            .attr('stdDeviation', 1)
            .attr('result', 'offsetblur');

        // translate output of Gaussian blur to the right and downwards with 2px
        // store result in offsetBlur
        filter.append('feOffset')
            .attr('in', 'blur')
            .attr('dx', .1)
            .attr('dy', .1)
            .attr('result', 'offsetBlur');

        filter.append('feComponentTransfer').append('feFuncA')
            .attr('type', 'linear')
            .attr('slope', 1)

        // overlay original SourceGraphic over translated blurred opacity by using
        // feMerge filter. Order of specifying inputs is important!
        let feMerge = filter.append('feMerge');

        feMerge.append('feMergeNode')
            .attr('in', 'offsetBlur')
        feMerge.append('feMergeNode')
            .attr('in', 'SourceGraphic');

        let pattern = defs.append('pattern')
            .attr('id','#basketball')
            .attr('height','100%')
            .attr('x',0)
            .attr('y',0)
            .attr('patternUnits','userSpaceOnUse')

        pattern.append('image')
            .attr('x',0)
            .attr('y',0)
            .attr('xlink:href', '../../figs/basketball.png');
        
    }

}