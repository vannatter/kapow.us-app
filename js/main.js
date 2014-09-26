////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SETTINGS ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ver = "1.1.10";
var uri = "http://kapow.us";
var menu_offset = 380;
var bootstrapped = false;
var profile_complete = false;
var is_wizard_firstpage = false;
var loading_text = "Loading Data";
var searching_text = "Searching...";
var sharing_text = "Sharing...";
var generic_error = "An error occurred, try again!";
var specific_error = "An error occurred - "; // error message appended to end
var data_menu;
var data_menu_total_new;
var calPlugin;
var gaPlugin;
var notice_timeout;
var notice_error_timeout;
var default_msg = $.mobile.loadingMessage;
var buffer;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// APP CONSTRUCTOR /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
		document.addEventListener("offline", appOffline, false);
		document.addEventListener("online", appOnline, false);
		document.addEventListener("resume", appResume, false);
		document.addEventListener("backbutton", appBack, false);
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
		appDeviceReady();
    }
};

function appDeviceReady() {

	$.support.touchOverflow = false;
	$.mobile.touchOverflowEnabled = false;
	$.mobile.iscrollview.prototype.options.pullDownResetText = 'Pull it!';

	_gaq.push(['_trackPageview', '/app/launch']);
	
	checkPreAuth();
    loadOnce();
	$.mobile.changePage("#home", {transition: "fade"}); 
}


$(document).delegate("#home", "pageinit", function(event) {
	$(".iscroll-wrapper", this).bind( {
	    "iscroll_onpulldown" : onPullDown,
	    "iscroll_onpullup"   : onPullUp
	});
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// APP CALLBACKS ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var login = function () {
    if (!window.cordova) {
        var appId = prompt("Enter FB Application ID", "");
        facebookConnectPlugin.browserInit(appId);
    }
    facebookConnectPlugin.login( ["email"], 
        function (response) { alert(JSON.stringify(response)) },
        function (response) { alert(JSON.stringify(response)) });
}

var showDialog = function () { 
    facebookConnectPlugin.showDialog( { method: "feed" }, 
        function (response) { alert(JSON.stringify(response)) },
        function (response) { alert(JSON.stringify(response)) });
}
                        
            
function appBack(e) {
	if ($.mobile.activePage.is('#login')) {
		e.preventDefault();
		navigator.app.exitApp();
	}
}

function appOffline() {
	console.log('we are offline');
	notice_error('You\'ve gone offline... check connection', 9000000);
}

function appOnline() {
	console.log('we are online');
/* 	$("#notice_error").fadeOut(); */
}

function appResume() {
	console.log('we are resumt');
	stageData();
}

function checkPreAuth() {
	var form = $("#loginForm");
	if (localStorage["username"] != undefined && localStorage["password"] != undefined) {
		if (localStorage["kli"] == 1) {
			$("#username", form).val(localStorage["username"]);
			$("#password", form).val(localStorage["password"]);
			$('#keep_logged_in').prop('checked', true);
			handleLogin();
		} else {
			$("#username", form).val("");
			$("#password", form).val("");
			$('#keep_logged_in').prop('checked', false);
		}
	}
}

function handleLogin() {
	$("#password").blur();
	$.mobile.loading( 'show', {
		text: 'Logging In',
		textVisible: true,
		theme: 'e',
		html: ""
	});

	var form = $("#loginForm");
	$("#submitButton",form).attr("disabled","disabled");
	var u = $("#username", form).val();
	var p = $("#password", form).val();
	
	if ($('#keep_logged_in').is(":checked")) {
		var kli = 1;
	} else {
		var kli = 0;
	}
	
    if (u != '' && p!= '') {
		$.ajax({
			type: "POST",
			url: uri + "/api/authenticate.json",
			data: { email: u, pass: p },
			dataType: "json",
			timeout: 10000,
			success: function(data) {
				if (data.status.status_code == "200") {
					localStorage["user_id"] = data.user.user_id;
					localStorage["email"] = data.user.email; 
					localStorage["password_hash"] = data.user.password_hash;
					localStorage["username"] = u;
					localStorage["password"] = p;
					localStorage["kli"] = kli;

					var done_load = stageData();
					if (done_load) { 
						$.mobile.changePage("#home", {transition: "fade"}); 
						notice("Welcome to CancerLateFX, " + u + "!", 5000);
					}
				} else {
					$.mobile.loading('hide');
					navigator.notification.alert(data.status.message + "\nPlease try again.", function() {});
				}
			},
			error: function(request, status, err) {
				if (status == "timeout") {
					$.mobile.loading('hide');
					navigator.notification.alert("Authentication timed out.\nPlease try again.", function() {});
				}
			}
		});
		$("#submitButton").removeAttr("disabled");
	} else {
		$.mobile.loading('hide');
		navigator.notification.alert("You must enter a username and password.", function() {});
		$("#submitButton").removeAttr("disabled");
	}
	return false;
}

function userLogin(user, hash) {
	$.ajax({
		type: "POST",
		url: uri + "/api/user_set.json",
		data: { user: user, hash: hash },
		dataType: "json",
		timeout: 10000,
		success: function(data) {
			if (data.status.status_code == "200") {
			} else {
				console.log(data.status.message);
			}
		},
		error: function(request, status, err) {
		}
	});
}

function userLogout() {
	$.ajax({
		type: "POST",
		url: uri + "/api/user_logout.json",
		data: { user: localStorage["userid"], hash: localStorage["password_hash"] },
		dataType: "json",
		timeout: 10000,
		success: function(data) {
			if (data.status.status_code == "200") {
			} else {
				console.log(data.status.message);
			}
		},
		error: function(request, status, err) {
		}
	});
}

function loadOnce() {
    $('.ver').append(ver);
}

function childBrowserClosed() {
}

function stageData() {
	bootstrapped = true;
	return true;
}

$(document).on("click", ".publisher_li", function(){ 
	alert("Goodbye!"); 
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PAGESHOW FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$('.header_button').on('click', function() {
	parent_id = $(this).parent().parent().attr("id");
	$("#menupanel_"+parent_id).panel( "open" , {} );
});

$("#login").on("pageshow", function(event, ui) {
	console.log('login load');	

});

$("#home").on("pageshow", function(event, ui) {

	$.mobile.loading( 'show', {
		text: loading_text,
		textVisible: true,
		theme: 'e',
		html: ""
	});
	
	if (!localStorage["this_weekxx"]) { // move it back to this_week once done polish
		
	    $.ajax({
	        type: "GET",
	        url: uri + "/items/this_week.json?ts=" + (new Date).getTime(),
	        dataType: "json",
	        timeout: 10000,
	        success: function(data) {
				if (data.status.status_code == "200") {
					hideMobile();
					localStorage["this_week"] = data;
					
					$('.block').fadeIn();
					
					var output = "";
					var fav_output = "";
					var fav_tmp = "";

					$.each(data.data.favorites, function(index) {
						fav_tmp += buildFavoriteListRow(data.data.favorites[index]);
					});					
					
					if (!fav_tmp) {
						fav_output += "<li class='li_hdr'>New Favorites</li>";
						fav_output += "<li class='li_blank'>No favorites found for this week, make sure you are logged in and you have content favorited.</li>";
					} else {
						fav_output += "<li class='li_hdr'>New Favorites</li>";
						fav_output += fav_tmp;
					}
					
					output += "<li class='li_hdr'>New for " + data.release_date + "</li>";
					$.each(data.data.publishers, function(index) {
						output += buildPublisherListRow(data.data.publishers[index]);
					});
					
					$('.favorites_this_week').html(fav_output);
					$('.favorites_this_week').show();
	
					$('.new_this_week').html(output);
					$('.new_this_week').show();
					
					$(".iscroll-wrapper").iscrollview("refresh");
					
				} else {
					hideMobile();
				}
			},
			error: function(request, status, err) {
				hideMobile();
			}
		});
		
	} else {
		console.log('build it from localstorage');
	}

	_gaq.push(['_trackPageview', '/app/home']);
});


$("#forgot").on("pageshow", function(event, ui) {
	console.log('forgot load');	
	_gaq.push(['_trackPageview', '/app/forgot_password']);
});



function flash(msg,delay,theme) {
	$('#flash h5').text(msg);
	$('#flash').fadeIn();
	setTimeout( function() { $("#flash").fadeOut(); }, delay );
}

function successHandler(result) {
	console.log('successHandler fired: ' + result + ' \n');
}

function errorHandler(result) {
	console.log('errorHandler fired ' + result + ' \n');
}

function hideMobile() {
	$.mobile.loading('hide');
}


function notice(msg, delay) {
	clearTimeout(notice_timeout);
	console.log('in notice(), displaying..');
	$('#notice h5').text(msg);
	$('#notice').fadeIn();
	notice_timeout = setTimeout( function() { $("#notice").fadeOut(); }, delay );
}

function notice_error(msg, delay) {
	clearTimeout(notice_error_timeout);
	$('#notice_error h5').text(msg);
	$('#notice_error').fadeIn();
	notice_error_timeout = setTimeout( function() { $("#notice_error").fadeOut(); }, delay );
}

function onPullDown(e, d) {
	console.log('onPullDown fire');
	$(".iscroll-wrapper").iscrollview("refresh");
}

function onPullUp() {
	alert('up');
}

function buildPublisherListRow(d) {
	var c = '<li data-publisher_id="' + d.publisher_id + '" data-theme="c" class="publisher_li list_row ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-btn-up-c"><div class="ui-btn-inner ui-li"><div class="ui-btn-text"><a href="javascript:;" class="ui-link-inherit">' + d.publisher_name + '</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span></div></li>';
	return c;
}

function buildFavoriteListRow(d) {

	console.log('in buildFavoriteListRow');

	var c = '<li data-item_id="' + d.publisher_id + '" data-theme="c" class="item_li list_row ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-first-child ui-btn-up-c"><div class="ui-btn-inner ui-li"><div class="ui-btn-text"><a href="javascript:;" class="ui-link-inherit">' + d.item.id + '</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span></div></li>';
	console.log(c);
	return c;
}
