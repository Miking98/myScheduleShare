$(document).ready(function() {

	////////////////////////////
	//// SEARCH FOR EVENTS /////
	////////////////////////////

	//Search events every time a user types in a key
	$("#content-content_hwlog").on('keyup', '#hwlog-addevent-search', function(e) {
		var searchquery = $(this).val();
		var searchresults = $("#hwlog-addevent-searchresult");
		if (searchquery=="") { //If query is ""
			//Clear search results
			searchresults.hide().html();
		}
		else {
			$.ajax({
				type: "POST",
				url: "../process/return_hwlog_eventstoadd.php",
				data: { 
					query: searchquery
				},
				dataType: "JSON"
			})
			.done(function(param) { //Param- variable returned by PHP file
				if (param.result=="dbfailure") { //Server/PHP error
					notify("Sorry, there was a database error - Please try again at a later time.", "error");
				}
				else if (param.result=="invalidinput") {
					notify("Invalid input!","error");
				}
				else { //Success
					var resulthtml = "<strong>Search results:</strong><br>";
					var events = [];
					events = $.map(param, function(obj) {
						var info = obj.info;
						return {
							id: obj.id,
							name: obj.name,
							occursInfo: info[0]
						}
					});
					if (events.length>0) { //There are search results
						for (var i = 0; i<events.length; i++) {
							resulthtml+='<div class="hwlog-addevent-searchresult-event search-result tooltip tooltip-hover" title="'+events[i].occursInfo+'">'+
											'<input type="hidden" class="hwlog-event-eventid" value="'+events[i].id+'">'+
											'<div class="addbtn approvereject_btn"><div class="addbtn_plus">+</div></div>'+
											'<div class="hwlog-event-eventname">'+events[i].name+'</div>'+
										'</div>';
						}
						searchresults.html(resulthtml).slideDown();
						init_tooltipster();
					}
					else { //No search results
						searchresults.html("No search results").show();
					}

				}
			});
		}
	});

	
	///// TOGGLE UPDATE ALL EVENTS ACTION-LINK /////
	$("#content-content_hwlog").on('click', '#hwlog-addevent, #hwlog-removeevent', function() {
		$("#hwlog-getcurrenthwall").hide();
	});
	$("#content-content_hwlog").on('click', '#hwlog-canceldelete, #hwlog-canceladd', function() {
		$("#hwlog-getcurrenthwall").show();
	});

	///// DELETE event ////
	
	//When Remove action-link is clicked, add delete icons to every event profile
	$("#content-content_hwlog").on('click','#hwlog-removeevent', function() {
		//$(".hwlog-event-delete").show(); //Show delete icon
		$(".hwlog-event-profile-content").css("padding-left","25px"); //Add padding to push content to the right of delete icon
	});
	//When Cancel action-link is clicked, remove delete icons and padding
	$("#content-content_hwlog").on('click', '#hwlog-canceldelete', function() {
		$(".hwlog-event-profile-content").css("padding-left","0px"); //Add padding to push content to the right of delete icon
	});


	//When delete button is clicked, call removeevent() function
	$("#content-content_hwlog").on('click','.hwlog-event-delete', function() {
		var eventid = $(this).siblings(".hwlog-event-profile-content").find(".hwlog-event-profile-eventid").val();
		var eventname = $(this).siblings(".hwlog-event-profile-content").find(".hwlog-event-profile-eventname").val();
		hwlog_removeevent(eventid, function(param) {
			if (param.result=="success") { //Success
				notify("Successfully removed <strong>"+eventname+"</strong> from your Homework Log.", "success");
				refresh_ajaxelements("content_hwlog"); //Just refresh HW Log Dashboard
			}
		});
	});

	///// ADD event ////
	
	
	//When add button is clicked, call addevent() function
	$("#content-content_hwlog").on('click','.hwlog-addevent-searchresult-event', function() {
		var eventid = $(this).children(".hwlog-event-eventid").val();
		var eventname = $(this).children(".hwlog-event-eventname").text();
		hwlog_addevent(eventid, function(param) {
			if (param.result=="success") { //Success
				notify("Successfully added <strong>"+eventname+"</strong> to your Homework Log.", "success");
				refresh_ajaxelements("content_hwlog"); //Just refresh HW Log Dashboard
			}
			else if (param.result=="noeventexists") {
				notify("The event that you tried to add to your Homework Log doesn't exist.", "error");
			}
		});
	});



	//// UPDATE event's HW /////
	var saveHWNotification; //Timer function
	$("#content-content_hwlog").on('keyup','.hwlog-event-profile-hw', function() {
    	clearTimeout(saveHWNotification);
		var elementID = $(this).attr('id');
		var eventid = $(this).parents(".hwlog-event-profile-content").find(".hwlog-event-profile-eventid").val();
		var eventname = $(this).parents(".hwlog-event-profile-content").find(".hwlog-event-profile-eventname").val();
		var hw = $(this).parents(".hwlog-event-profile-content").find(".hwlog-event-profile-hw").val();
		hwlog_updateeventhw(eventid, hw, function(param) {
			if (param.result=="success") { //Success
				//No need to refresh HW Log Dashboard, because current state is the saved state
				/*refresh_ajaxelements("content_hwlog", function() { //Just refresh HW Log Dashboard
					$("#"+elementID).focus();
				});*/
				saveHWNotification = setTimeout(function(){ notify("Successfully saved homework for <strong>"+eventname+"</strong>.", "success"); }, 1000);
			}
			else if (param.result=="eventnotinhwlog") { //User hasn't added this event yet to his HW log dashboard
				notify("Error - You haven't added the event whose homework you updated to your Homework Log yet.", "error");
			}
		});
	});


	//// GET CURRENT HW FOR AN EVENT ////
	$("#content-content_hwlog").on('click', '.hwlog-event-profile-hw-getcurrenthw, #hwlog-getcurrenthwall', function() {
		var eventids = [];
		var eventname = "";
		if ($(this).attr('id')=="hwlog-getcurrenthwall") { //Update all button clicked, get all HW
			$(".hwlog-event-profile-eventid").each(function() {
				eventids.push($(this).val()); //Push every Event ID on HW log into eventids array()
			})
			eventname = "these classes";
		}
		else { //Just one HW update button clicked, just get that one event's HW
			eventids.push($(this).parents(".hwlog-event-profile-content").children(".hwlog-event-profile-eventid").val()); //Array of 1 element, just this Event's ID
			eventname = "<strong>"+$(this).parents(".hwlog-event-profile-content").children(".hwlog-event-profile-eventname").val()+"</strong>"; //Event's name
		}
		hwlog_updatecurrenthw(eventids, true, function(param) {
			if (param.result!="dbfailure"&&param.result!="invalidinput") { //HW data returned in ID-Name Object
				var eventsHW = [];
				eventsHW = $.map(param, function(obj) {
					return {
						eventID: obj.id,
						HW: obj.name
					}
				});
				for (var i = 0; i<eventsHW.length; i++) {
					$("#hwlog-event-profile-hw-"+eventsHW[i].eventID).val(eventsHW[i].HW); //Set each textfield for this event in the HW log to have its returned, updated, current HW
				}
				notify("Successfully updated homework for "+eventname+".", "success");
			}
		})
	});

});	