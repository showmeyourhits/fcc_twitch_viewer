var FT = {
	client_id:"qs0j10r4v207j0gsp4i96djauyzti18",
	apiLink:"https://api.twitch.tv/kraken",
	searchApi: "/search/channels",
	value: "",
	total:0,
	offset:0,
	moreButton: undefined,
	streamsApi: "/streams",
	channelsApi: "/channels",
	kappa:"<img src=\"https://static-cdn.jtvnw.net/emoticons/v1/25/1.0\" alt=\"Kappa\">",
	defaultAvatar:"https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png",
	loadingTimeout:undefined,
	loadStreams:function () {
		for(var name in FT.following){
			if(name !== "length"){
				this.loadChannelInfo(name);
			}
		}
	},
	loadChannelInfo: function(name){
		$.getJSON(`${this.apiLink}${this.streamsApi}/${name}?client_id=${this.client_id}`,function(data){
			if(data.stream){
				FT.showChannelInfo(data.stream.channel, true);
			}else{
				// for logo
				$.getJSON(`${FT.apiLink}${FT.channelsApi}/${name}?client_id=${FT.client_id}`, function(channel){
					FT.showChannelInfo(channel, false);	
				});
			}
		});

	},
	showChannelInfo:function(channel, online){
		$("#info_header").html("Following streamers").css("display","none");
		$(".streamers").append(FT.makeChannelElement(channel, online)).css("display","flex");
	},
	shorten: function(str, val){
		if(str.length > val){
			return str.slice(0, val-3) + "...";
		}else{
			return str;
		}
	},
	makeChannelElement:function(channel, online){
		let cont = $("<section>").addClass("streamer");

		let logo = $("<img>").attr("src",channel.logo?channel.logo:this.defaultAvatar).addClass("streamer_logo");
		let name = $("<p>").addClass("streamer_name").html(`<a href="${channel.url}" target="_blank">${channel.display_name}</a>`);
		let game = $("<p>").addClass("streamer_info");
		if(online){
			game.html(this.shorten(channel.game, 19));
		}else{
			game.html("Offline");
			cont.addClass("offline");
		}
		let btn = $("<button class=\"btn_remove\">x</button></section>").attr("data-streamername",channel.name).on("click", this.removeStreamer);

		cont.append(logo).append(name).append(game).append(btn);

		return cont;
	},
	search: function(e){
		if(e.which === 13){
			console.log(`Searching for ${e.target.value}`);
			FT.value = e.target.value;

			$(".search_results").empty();
			// animation Kappa
			FT.loading($(".search_results"));
			
			$.getJSON(`${this.apiLink}${this.searchApi}?client_id=${this.client_id}&q=${e.target.value}`, function(data){
				FT.total = data["_total"];
				console.log(`Successed request: ${FT.total} like that`);
				FT.showSearchResults(data["channels"]);
			}).fail(function(){
				console.log("Failed search request");
				FT.showSearchResults([]);
			});

		}else if(e.target.value === ""){
			this.clearSearchResults();
		}
	},
	addStreamer: function(e){
		let name = e.target.dataset.streamername;
		
		if(FT.following[name]){
			console.log("Already following");
		}else{
			FT.following[name] = true;
			FT.following.length += 1;
			localStorage.following = JSON.stringify(FT.following);

			FT.loadChannelInfo(name);
		}
	},
	removeStreamer: function(e){
		let name = e.target.dataset.streamername;
		delete FT.following[name];
		FT.following.length -= 1;
		localStorage.following = JSON.stringify(FT.following);

		e.target.parentElement.remove();
		if(FT.following.length <= 0){
			delete localStorage.following;
			$("#info_header").html(`Search for streamers to see what they are doing. ${FT.kappa}`).css("display","block");
		}
	},
	makeSearchElement: function(result){
		let cont = $("<section>").addClass("search_result");
		let logo = $("<img>").attr("src",result.logo?result.logo:this.	defaultAvatar).addClass("search_logo");
		let name = $("<p>").addClass("search_name").html(result.display_name);
		// button value
		// if already in list
		let btn = $("<button>").addClass("btn_add").attr("data-streamername",result.name).html("+");
		btn.on("click", this.addStreamer);

		cont.append(logo).append(name).append(btn);

		return cont;
	},
	makeMoreButton: function(){
		let btn = $("<button>").addClass("btn_add btn_more").html("More");
		return btn;
	},
	showSearchResults: function(results, end){
		let searchContainer = $(".search_results");
		searchContainer.empty();
		if(this.loadingTimeout){
			clearTimeout(this.loadingTimeout);
		}
		if(!results.length){
			searchContainer.innerHTML = "Sorry, can't find any streamers named like that."
		}else{
			console.log(`${results.length} named like that`);
			for(var i = 0; i < results.length; i++){
				searchContainer.append(this.makeSearchElement(results[i]));
			}
			if(!end){
				FT.moreButton = FT.moreButton || FT.makeMoreButton();
				FT.moreButton.on("click", function(e){
					FT.offset += results.length;
					if(FT.offset <= FT.total){
						$(".search_results").empty();
						// animation Kappa
						FT.loading($(".search_results"));

						$.getJSON(`${FT.apiLink}${FT.searchApi}?client_id=${FT.client_id}&q=${FT.value}&offset=${FT.offset}`,
						 function(data){
							console.log(`Successed "more" request for ${FT.offset} offset`);
							FT.showSearchResults(data["channels"], (FT.total - FT.offset) < 10);
						}).fail(function(){
							console.log("Failed search request");
							FT.showSearchResults([]);
						});
					}
				});
				searchContainer.append(FT.moreButton);
			}
		}
	},
	loading:function(element){

		var loadingEl = $(this.kappa).addClass("loading");
		element.append(loadingEl);
		element.append("<p class=\"loading\">Loading...</h3>")

		var currentDegree = 10;
		this.loadingTimeout = setTimeout(function rotate(){
			loadingEl.css("transform",`rotate(${currentDegree}deg)`);
			currentDegree = (currentDegree + 10)%360;
			this.loadingTimeout = setTimeout(rotate.bind(this), 50);
		}.bind(this),50);
	},
	clearSearchResults: function(){
		let searchContainer = $(".search_results")[0];
		while(searchContainer.firstChild){
			searchContainer.firstChild.remove();
		}
	}
}

$(function(){
	$("#streamers_search").on("keyup", FT.search.bind(FT));
	let header = $("#info_header")[0];
	try{
		FT.following = JSON.parse(localStorage.following);
	}catch(e){
		FT.following = {length: 0};
	}

	if(FT.following.length <= 0){
		
		let streamers = $(".streamers");
		
		header.innerHTML = `Search for streamers to see what they are doing. ${FT.kappa}`;
		streamers.css("display","none");
	}
	else{
		header.innerHTML = `Loading your favorite streamers info...`;
		FT.loadStreams(FT.following);
	}
})
