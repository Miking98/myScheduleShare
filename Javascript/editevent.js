$(document).ready(function() {

	//Today's date formatted MM/DD/YYYY
	var todayDateFormatted = getTodayDate();

	//Initialize Teacher Select2 dropdown
	init_editeventteacher_dropdown(($("#editevent-teacher-teacherobj").length>0) ? $.parseJSON(atob($("#editevent-teacher-teacherobj").val())) : null); //JSON object
	//Initialize Shared With Select2 Tagslist
	init_editeventinvited_tagslist(($("#editevent-invited-personobjs").length>0) ? $.parseJSON(atob($("#editevent-invited-personobjs").val())) : null); //JSON object
	//Initialize Event Series Select2 Tagslist
	init_editeventeventseries_tagslist(($("#editevent-eventseries-eventseriesobjs").length>0) ? $.parseJSON(atob($("#editevent-eventseries-eventseriesobjs").val())) : null); //JSON object

	//True if Save button was just clicked
	var saveClicked = false;
	//True if Save button was already clicked - use to prevent multiple creations
	var saveAlreadyClicked = false;

	//Link to "Edit Recurs Information" next to Repeats text
	var editrecurslink = '<span style="text-decoration:none">&nbsp;&nbsp;</span><span id="editevent-recurs-edit" class="action-link">Edit</span>'; //Link to edit recurring information after it is set
	
	//Recurs Objects
	var RecursEventObj = new RecurringEventObject(); //Recurring event object
	var defaultRecursEventObj = new RecurringEventObject(); //Default recurring event object
	if ($("#editevent-recurs-trueorfalse").val()=="true") { //This event was recurring before being edited
		RecursEventObj.setEventBlockStart($("#editevent-recurs-recursobj-eventblockstart").val()); //UNIX
		RecursEventObj.setEventBlockEnd($("#editevent-recurs-recursobj-eventblockend").val()); //UNIX
		RecursEventObj.setAllDay((($("#editevent-allday").is(":checked")) ? true : false));
		RecursEventObj.setDay($("#editevent-recurs-recursobj-day").val());
		RecursEventObj.setWeek($("#editevent-recurs-recursobj-week").val());
		RecursEventObj.addJSONDaysOfWeek($("#editevent-recurs-recursobj-dayofweek").val()); //JSON string
		RecursEventObj.setMonth($("#editevent-recurs-recursobj-month").val());
		RecursEventObj.setDayOfMonth($("#editevent-recurs-recursobj-dayofmonth").val());
		RecursEventObj.setDayOccurrenceInMonth($("#editevent-recurs-recursobj-dayoccurrenceinmonth").val());
		RecursEventObj.setYear($("#editevent-recurs-recursobj-year").val());
		RecursEventObj.setThisMonth($("#editevent-recurs-recursobj-thismonth").val());
		RecursEventObj.setEndsVal($("#editevent-recurs-recursobj-endsval").val()); //String, "after", "by", or null for never

		if ($("#editevent-recurs-recursobj-endsval").val()=="after") {
			RecursEventObj.setEndsAfterOccurrences($("#editevent-recurs-recursobj-endsafteroccurrences").val());
		}
		else if ($("#editevent-recurs-recursobj-endsval").val()=="by") {
			RecursEventObj.setEndsByTime($("#editevent-recurs-recursobj-endsbytime").val());
		}
		else {
			//Never ends
		}
		//Set Repeats Summary Text
		$("#editevent-recurs-summary").html(RecursEventObj.getSummary()+editrecurslink);
	}


	///// FILL invited TAGSLIST WITH GROUP MEMBERS ////
	$(document.body).on('click', '.editevent-invited-group-group', function() {
		var groupID = $(this).siblings(".editevent-invited-group-id").val(); //Group ID
		peoplegroups_getmembers(groupID, function(param) {
			//Add each Member's Person object data (in form of tags) to main Tagslist
			$("#editevent-invited-tagslist").select2("data", param);
		});
	});

	///// TOGGLE invited TAGSLIST WHEN PRIVATE/PUBLIC VISIBILITY CHECKBOX IS CLICKED /////
	$(document.body).on('click', '#editevent-visibility', function() {
		if ($(this).is(":checked")) { //Yes private
			//Show invited tagslist
			$("#editevent-invited-container").show();
			$("#editevent-sharedwith-container").hide();
		}
		else { //Public
			//Hide invited tagslist
			$("#editevent-invited-container").hide();
			$("#editevent-sharedwith-container").show();
		}
	});


	///// TOGGLE CREATE EVENT TAG ////
	$(document.body).on('click', '.editevent-createtag-toggle', function() {
		$("#editevent-createtag-container").slideToggle();
		$("#editevent-createtag-field").toggleClass("optionalfield").val("");
		if ($(this).text()=="Create a new event tag") {
			$(this).text("Cancel");
		}
		else {
			$(this).text("Create a new event tag");
		}
	});

	//// CREATE EVENT TAG ////
	$(document.body).on('click', '#editevent-createtag-create', function(e) { //Create tag when "Create tag" button is clicked
		e.preventDefault(); //Prevent form submission
		var tagname = $("#editevent-createtag-field").val();
		editevent_createtag(tagname);
	})
	$(document.body).on('keypress', '#editevent-createtag-field', function(e) { //Create tag when Enter button is pressed while typing in the Create tag input field
		if (e.keyCode == 13) { //Enter key is pressed
			e.preventDefault(); //Prevent form submission
			var tagname = $("#editevent-createtag-field").val();
			editevent_createtag(tagname);
		}
	})

	function editevent_createtag(tagname) {
		createtag(tagname, function(param) {
			if (param.result=="success") {
				notify("Successfully created tag.", "success");
				var tagid = param.tagid;
				var newlabel = '<label><input id="editevent-tag-'+tagid+'" name="editevent-tag" type="radio" value="'+tagid+'" checked />'+tagname+'</label>';
				$(newlabel).appendTo("#editevent-tag");
				$(".editevent-createtag-toggle").trigger("click"); //Trigger toggle of Create Tag container
			}
			else if (param.result=="tagalreadycreated") {
				notify("You've already created a tag with this name.", "error");
			}
			else {
				notify("Sorry, there was an error.", "error");
			}
		})
	}

	///// TOGGLE ALL DAY CHECKBOX ////
	$(document.body).on('change', '#editevent-allday', function() {
		if ($(this).is(":checked")) {
			$("#editevent-starttime, #editevent-endtime").hide().removeClass("optionalfield").val("12:00am"); //Reset time
			toggleEditEventDateTimeBoxes(false, true, false, true, true, false);
		}
		else {
			$("#editevent-starttime, #editevent-endtime").show().addClass("optionalfield").val("12:00am"); //Reset time
			toggleEditEventDateTimeBoxes(false, true, true, true, true, true);
		}
		if ($("#editevent-recurs").is(":checked")) { //If Repeats checbox is checked, event is recurring
			RecursEventObj.setAllDay($(this).is(":checked"));
			$("#editevent-recurs-summary").html(RecursEventObj.getSummary()+editrecurslink);
			if (RecursEventObj.getWeek()!="*"&&RecursEventObj.getWeek()!="") { //Weekly
				toggleEditEventDateTimeBoxes(true, true, false, false, false, false);
			}
			else { //Daily, Monthly, Yearly
				if ($(this).is(":checked")) { //All day, no need to select time range
					toggleEditEventDateTimeBoxes(false, true, false, true, true, false);
				}
				else { //Not checked
					toggleEditEventDateTimeBoxes(false, true, true, true, true, true);
				}
			}
		}
	});


	///// STARTTIME OR ENDTIME IS CHANGED, UPDATE RECURSEVENTOBJ ////
	$(document.body).on('change', '#editevent-starttime, #editevent-endtime', function() {
		var eallday = (($("#editevent-allday").is(":checked")) ? "true" : "false");
		//Not a weekly event, the Event-startdate and Event-starttime input boxes are for real
		if (RecursEventObj.getWeek()=="*"||RecursEventObj.getWeek()=="") { //Daily, Monthly, or Yearly event
			var newEventBlockStartUNIX = generateUNIXFromDatepickerTimepicker($("#editevent-startdate").val(), $("#editevent-starttime").val(), eallday); //Start date selected by user, Start time of first selected day of week, all day info
			var newEventBlockEndUNIX = generateUNIXFromDatepickerTimepicker($("#editevent-enddate").val(), $("#editevent-endtime").val(), eallday); //End date selected by user, End time of first selected day of week, all day info
			RecursEventObj.setEventBlockStart(newEventBlockStartUNIX);
			RecursEventObj.setEventBlockEnd(newEventBlockEndUNIX);
			//Update Day of Week array info
			var daysOfWeek = RecursEventObj.getDayOfWeek(); //Array of Days of Week already added
			if (daysOfWeek.length>0) {
				RecursEventObj.addDayOfWeek(daysOfWeek[0][0], newEventBlockStartUNIX, newEventBlockEndUNIX);
			}
		}
	});

	///// STARTDATE OR ENDDATE IS CHANGED, UPDATE RECURSEVENTOBJ ////
	$(document.body).on('change', '#editevent-startdate, #editevent-enddate', function() {
		var eallday = ($("#editevent-allday").is(":checked") ? "true" : "false");
		var daysOfWeek = RecursEventObj.getDayOfWeek(); //Array of Days of Week already added
		if (RecursEventObj.isSet()) {
			if (RecursEventObj.getWeek()!="*"&&RecursEventObj.getWeek()!="") { //Weekly event
				if (daysOfWeek.length>0) {
					//Start date and time
					var oldEventBlockStartUNIX = RecursEventObj.getEventBlockStart();
					var newEventBlockStartUNIX = generateUNIXFromDatepickerTimepicker($("#editevent-startdate").val(), moment.unix(oldEventBlockStartUNIX).subtract(moment.unix(oldEventBlockStartUNIX).utcOffset(), 'm').format("h:mma"), eallday, days[daysOfWeek[0][0]]); //Start date selected by user, Start time of first selected day of week, all day info, name of first selected day of week 
					var diffInUNIXOldNew = oldEventBlockStartUNIX-newEventBlockStartUNIX;
					//Detect how many UNIX seconds are different from previous and current UNIX start dates
					RecursEventObj.setEventBlockStart(newEventBlockStartUNIX);
					//End date and time - End time of first selected day of week
					var oldEventBlockEndUNIX = RecursEventObj.getEventBlockEnd();
					RecursEventObj.setEventBlockEnd(oldEventBlockEndUNIX-diffInUNIXOldNew);
					for (var i = 0; i<daysOfWeek.length; i++) {
						RecursEventObj.addDayOfWeek(daysOfWeek[i][0], daysOfWeek[i][1]-diffInUNIXOldNew, daysOfWeek[i][2]-diffInUNIXOldNew);
					}
				}
			}
		}
	});



	///// DELETE EVENT ////

	//When delete button is clicked, call deleteevent() function
	$('#editevent-delete').confirmOn({
		questionText: 'Are you sure you want to <strong>DELETE</strong> this event?<br><br>This action <strong>cannot be undone.</strong>',
		textYes: 'Yes, DELETE this event',
		textNo: 'Oops, No!',
		styleYes: 'danger',
		styleNo: 'secondary'
	}, 'click', function(e, confirmed) {
		if (confirmed) { //Confirm user wants to permanently delete this event
			//Prevent multiple PHP requests
			editevent_startDisable();

			deleteevent($("#editevent-eventid").val(), function(param, wasHandled) {
				if (param.result=="success") { //Success
					window.location.replace(param.redirect);
				}
				else if (param.result=="nopermission") {
					notify("You don't have permission to delete this event since someone else created it.","error");
				}
				else if (!wasHandled) { //If invalid query
					notify("Sorry, there was an error", "error");
				}
				editevent_endDisable();
			});
		}
	});


	///// REMOVE EVENT ////

	//When remove button is clicked, call removeeventfromschedule() function
	$(document.body).on('click', '#editevent-remove', function() {
		//Prevent multiple PHP requests
		editevent_startDisable();

		removeeventfromschedule($("#editevent-eventid").val(), "true", function(param, wasHandled) {
			if (param.result=="success") { //Success
				notify("Successfully removed event!", "success");
			}
			else if (!wasHandled) { //If invalid query
				notify("Sorry, there was an error", "error");
			}
			editevent_endDisable();
		});
	});

	///// SAVE EVENT /////
	
	//When save button is clicked, save event to the database
	$(document.body).on('click', '#editevent-save, #editevent-save2', function(e) {
		e.preventDefault(); //Prevent form submission
		
		//Prevent multiple PHP requests
		editevent_startDisable();

		var eid = $("#editevent-eventid").val();
		var ename = $("#editevent-name").val();

		var eallday = ($("#editevent-allday").is(":checked") ? "true" : "false");
		var erecur = ($("#editevent-recurs").is(":checked") ? "true" : "false");

		if (erecur=="true") { //This event repeats
			var estart = $.extend(true, {}, RecursEventObj); //Store Recurs Event Obj instead of simple UNIX timestamp
			var eend = "none";
		}
		else { //One-time event
			var starttime = $("#editevent-starttime").val();
			var endtime = $("#editevent-endtime").val();
			if (eallday=="true") { //Set start and end to 0:00am if all day event
				starttime = "0:00am";
				endtime = "0:00am"; 
			}
			var estart = generateUNIXFromDatepickerTimepicker($("#editevent-startdate").val(), starttime, eallday);
			var eend = generateUNIXFromDatepickerTimepicker($("#editevent-enddate").val(), endtime, eallday);
		}

		if (eallday=="true") { //Add one day to end time, b/c Full Calendar makes end dates exclusive
			eend += 60*60*24;
		}

		var emeeting = ($("#editevent-meeting").is(":checked") ? "true" : "false");
		var einvited = $("#editevent-invited-tagslist").val();

		var eteacher = $("#editevent-teacher").val();

		var ecolor = $("#editevent-color").spectrum("get").toHexString();
		var evisibility = (!$("#editevent-visibility").is(":checked") ? "true" : "false");

		//Tag
		var enewtag = $("#editevent-newtag").val();
		var etag = $("#editevent-tag input[type=radio]:checked").val();

		//HW and Description
		var ehw = $("#editevent-hw").val();
		var edescrip = $("#editevent-descrip").val();

		//List of Event Series IDs
		var eeventseries = $("#editevent-eventseries-tagslist").val();

		//True if we are creating this event
		var ecreateevent = ($("#editevent-createevent").val()==1 ? "true" : "false");

		//Redirection
		var ertms = (ecreateevent=="true" ? "true" : "false"); //If creating event, return to main schedule
		var eedit = "false";

		editevent(eid, ename, estart, eend, eallday, erecur, emeeting, einvited, eteacher, ecolor, evisibility, enewtag, etag, ehw, edescrip, eeventseries, ecreateevent, ertms, eedit, function(param, wasHandled) {
			if (param.result=="success") { //Success
				notify("Successfully edited event!", "success");
			}
			else if (!wasHandled) {
				notify("Sorry, there was an error.", "error");
			}
			editevent_endDisable();
		});
	});


	//// RECURS TOOLTIP /////

	//Tooltip
	var recurstooltip;
	function createRecurDialogue(content) {
		recurstooltip = $('<div/>').qtip({
			id: 'recurs-tooltip',
			style: 'qtip-recurs',
			prerender: true,
			content: {
				text: ' ',
				title: '',
				button: 'Close'
			},
			position: {
				my: 'center',
				at: 'center',
				target: $(window),
				viewport: $(window),
			},
			show: {
				modal: {
					on: true,
					blur: true,
					espace: true
				}
			},
			events: {
				hide: function(event, api) {
					//Check or Uncheck Recurs checkbox
					if (!saveClicked) { //Cancel this
						RecursEventObj = $.extend(true, {}, defaultRecursEventObj);
						$("#editevent-recurs-summary").html(RecursEventObj.getSummary()+editrecurslink).show(); //Set main Recurs Summary text as current Summary text
					}
					if (!RecursEventObj.isSet()) { //No recurring information currently selected
						$("#editevent-recurs").prop('checked', false); //Uncheck Repeats checkbox
						$("#editevent-recurs-label").css("font-weight","normal"); //Unboldify "Repeats" text to indicate that this event doesn't repeat
						$("#editevent-recurs-summary").html(""); //Clear Repeats text
						//Show normal start and end timepickers
						toggleEditEventDateTimeBoxes(false, true, true, true, true, true);
					}
					else { //Recurring information currently selected
						if (RecursEventObj.getWeek()!="*"&&RecursEventObj.getWeek()!="") {
							//Only show "Start: " and Startdate input box
							toggleEditEventDateTimeBoxes(true, true, false, false, false, false);
						}
					}
					saveClicked = false;
					api.destroy();
				}
			},
			hide: false
		}).qtip('api');

		recurstooltip.set({
			'content.text': content
		}).show();
				
		init_datepickers(); //Initialize datepickers
	}


	//WHEN EDIT LINK IS CLICKED
	$(document.body).on('click', '#editevent-recurs-edit', function() {
		//Save default RecursEventObj in case of Cancel
		defaultRecursEventObj = $.extend(true,{},RecursEventObj);
		var daily = RecursEventObj.getDay()!=="*"&&!isnullorundef(RecursEventObj.getDay())&&RecursEventObj.getDay()!=="";
		var weekly = RecursEventObj.getWeek()!=="*"&&!isnullorundef(RecursEventObj.getWeek())&&RecursEventObj.getWeek()!=="";
		var monthly = RecursEventObj.getMonth()!=="*"&&!isnullorundef(RecursEventObj.getMonth())&&RecursEventObj.getMonth()!=="";
		var yearly = RecursEventObj.getYear()!=="*"&&!isnullorundef(RecursEventObj.getYear())&&RecursEventObj.getYear()!=="";
		var endsNever = RecursEventObj.getEndsNever();
		var endsAfter = RecursEventObj.getEndsAfter();
		var endsAfterOccurrences = RecursEventObj.getEndsAfterOccurrences();
		var endsBy = RecursEventObj.getEndsBy();
		var endsByTimeDate = RecursEventObj.getEndsByTimeDate();
		var content = '<div id="editevent-recurs" class="qtip-content">'+
						'<h3>Repeating Event</h3>'+
						'<table>'+
							'<tr>'+
								'<td>Repeats:</td>'+
								'<td>'+
									'<select id="editevent-recurs-repeats" class="editevent-recurs-summarytemp-change">'+
										'<option value="day"'+(daily ? " selected" : "")+'>Daily</option>'+
										'<option value="week"'+(weekly ? " selected" : "")+'>Weekly</option>'+
										'<option value="month"'+(monthly ? " selected" : "")+'>Monthly</option>'+
										'<option value="year"'+(yearly ? " selected" : "")+'>Yearly</option>'+
									'</select>'+
								'</td>'+
							'</tr>'+
							'<tr id="editevent-recurs-every-container">'+
							'</tr>'+
							'<tr id="editevent-recurs-on-container">'+
							'</tr>'+
							'<tr id="editevent-recurs-on-week-daytimeframe-container">'+
							'</tr>'+
								'<td>Starts on:</td>'+
								'<td>'+
									$("#editevent-startdate").val()+ //Start date selected by user
								'</td>'+
							'<tr>'+
								'<td>Ends:</td>'+
								'<td>'+
									'<select id="editevent-recurs-ends" class="editevent-recurs-summarytemp-change">'+
										'<option value="never"'+(endsNever ? " selected" : "")+'>Never</option>'+
										'<option value="after"'+(endsAfter ? " selected" : "")+'>After</option>'+
										'<option value="by"'+(endsBy ? " selected" : "")+'>By</option>'+
									'</select>'+
									'<div id="editevent-recurs-ends-after-container" class="inline'+(endsAfter ? "" : " display-none")+'">'+
										'<input id="editevent-recurs-ends-after" class="editevent-recurs-summarytemp-change inline onclick-selecttext textfield tiny" type="text" value="'+(endsAfter ? endsAfterOccurrences : "1")+'" /> occurrences'+
									'</div>'+
									'<div id="editevent-recurs-ends-by-container" class="editevent-recurs-summarytemp-change inline'+(endsBy ? "" : " display-none")+'">'+
										'<input id="editevent-recurs-ends-by" class="center datepicker inline medium-small nolimit textfield" placeholder="" type="text" title="Event\'s end date" value="'+(endsBy ? endsByTimeDate : todayDateFormatted)+'" />'+
									'</div>'+
								'</td>'+
							'</tr>'+
						'</table>'+
						'<div id="editevent-recurs-summarytemp-container">'+
							'<strong>Summary: <span id="editevent-recurs-summarytemp"></span></strong>'+
						'</div>'+
						'<button id="editevent-recurs-submit" class="action btn">Done</button>'+
						'<button id="editevent-recurs-cancel" class="btn danger">Cancel</button>'+
					  '</div>';
		createRecurDialogue(content);
		if (daily) { printEveryDay(RecursEventObj.getDay()); }
		else if (weekly) { printEveryWeek(RecursEventObj.getWeek()); printOnWeek(RecursEventObj.getDayOfWeek()); }
		else if (monthly) { printEveryMonth(RecursEventObj.getMonth()); printOnMonthAndYear(RecursEventObj.getDayOccurrenceInMonth(), RecursEventObj.getDayOfWeek(), RecursEventObj.getDayOfMonth()); }
		else if (yearly) { printEveryYear(RecursEventObj.getYear()); printOnMonthAndYear(RecursEventObj.getDayOccurrenceInMonth(), RecursEventObj.getDayOfWeek(), RecursEventObj.getDayOfMonth()); }
		updateRepeatsSummary(); //Generate current Repeats Summary
	});

	//WHEN RECUR CHECKBOX IS CLICKED, SHOW DIALOGUE BOX
	$(document.body).on('change', '#editevent-recurs', function() {
		if ($(this).is(":checked")) { //Repeats input is checked
			var content = '<div id="editevent-recurs" class="qtip-content">'+
							'<h3>Repeating Event</h3>'+
							'<table>'+
								'<tr>'+
									'<td>Repeats:</td>'+
									'<td>'+
										'<select id="editevent-recurs-repeats" class="editevent-recurs-summarytemp-change">'+
											'<option value="day">Daily</option>'+
											'<option value="week" selected>Weekly</option>'+
											'<option value="month">Monthly</option>'+
											'<option value="year">Yearly</option>'+
										'</select>'+
									'</td>'+
								'</tr>'+
								'<tr id="editevent-recurs-every-container">'+
								'</tr>'+
								'<tr id="editevent-recurs-on-container">'+
								'</tr>'+
								'<tr id="editevent-recurs-on-week-daytimeframe-container">'+
								'</tr>'+
									'<td>Starts on:</td>'+
									'<td>'+
										$("#editevent-startdate").val()+ //Start date selected by user
									'</td>'+
								'<tr>'+
									'<td>Ends:</td>'+
									'<td>'+
										'<select id="editevent-recurs-ends" class="editevent-recurs-summarytemp-change">'+
											'<option value="never" selected>Never</option>'+
											'<option value="after">After</option>'+
											'<option value="by">By</option>'+
										'</select>'+
										'<div id="editevent-recurs-ends-after-container" class="display-none inline">'+
											'<input id="editevent-recurs-ends-after" class="editevent-recurs-summarytemp-change inline onclick-selecttext textfield tiny" type="text" value="1"> occurrences'+
										'</div>'+
										'<div id="editevent-recurs-ends-by-container" class="display-none editevent-recurs-summarytemp-change inline">'+
											'<input id="editevent-recurs-ends-by" class="center datepicker inline medium-small nolimit textfield" placeholder="" type="text" title="Event\'s end date" value="'+todayDateFormatted+'" />'+
										'</div>'+
									'</td>'+
								'</tr>'+
							'</table>'+
							'<div id="editevent-recurs-summarytemp-container">'+
								'<strong>Summary: <span id="editevent-recurs-summarytemp"></span></strong>'+
							'</div>'+
							'<button id="editevent-recurs-submit" class="action btn">Done</button>'+
							'<button id="editevent-recurs-cancel" class="btn danger">Cancel</button>'+
						  '</div>';
			createRecurDialogue(content);
			printEveryWeek();
			printOnWeek();
			updateRepeatsSummary(); //Generate current Repeats Summary
		}
		else { //Don't show modal popup since user has unchecked the "Repeats" checkbox
			$("#editevent-recurs-label").css("font-weight","normal"); //Unboldify "Repeats" text to indicate that this event doesn't repeat
			//Reshow date and time input boxes
			toggleEditEventDateTimeBoxes(false, true, true, true, true, true);
		}
	});


	//WHEN "DONE" BUTTON IS CLICKED IN RECURS POPUP, SAVE CHANGES TO RECURS-SUMMARY
	$(document.body).on('click', '#editevent-recurs-submit', function(e) {
		saveClicked = true;
		recurstooltip.hide(); //Hide Qtip Recurs Popup
		$("#editevent-recurs-summary").html(RecursEventObj.getSummary()+editrecurslink).show(); //Set main Recurs Summary text as current Summary text
		$("#editevent-recurs-label").css("font-weight","bold"); //Boldify "Repeats" text to indicate that this event repeats
		$("#editevent-recurs").prop('checked', true); //Uncheck Repeats checkbox//Check Repeats checkbox
	});

	//WHEN "CANCEL" BUTTON IS CLICKED IN RECURS POPUP, CLOSE POPUP AND RESTORE "REPEATS" CHECKBOX'S PREVIOUS STATE
	$(document.body).on('click', '#editevent-recurs-cancel', function(e) {
		recurstooltip.hide(); //Hide Qtip Recurs Popup
	});


	//TOGGLE RECURS CHECKBOX
	$(document.body).on('change', '#editevent-recurs', function() {
		if (!$(this).is(":checked")) { //Recurs checkbox has been unchecked
			$("#editevent-recurs-summary").text("").hide(); //Hide Main Repeats Summary and clear text
			$("#editevent-recurs-label").css("font-weight","normal"); //Unbold Recurs text
			//Check if all day is checked, if so revert back to All Day formatting for start and end date textfields
			if ($("#editevent-allday").is(":checked")) {
				toggleEditEventDateTimeBoxes(false, true, false, true, true, false);
			}
		}
	});

	//CHANGE EVERY/ON BOX BASED ON WHETHER USER SELECTS DAY/WEEK/MONTH/YEAR
	$(document.body).on('change', '#editevent-recurs-repeats', function(e) {
		var repeatStatus = $(this).val();
		if (repeatStatus=="day") { //Daily repeat
			printEveryDay();
		}
		else if (repeatStatus=="week") { //Weekly repeat
			printEveryWeek();
			printOnWeek();
		}
		else if (repeatStatus=="month") { //Monthly repeat
			printEveryMonth();
			printOnMonthAndYear();
		}
		else if (repeatStatus=="year") { //Yearly repeat
			printEveryYear();
			printOnMonthAndYear();
		}
		else {
			notify("Invalid <strong>Repeats</strong> value selected.", "error");
		}
	});

	// CHANGE ON2 <SELECT> FOR MORE PRECISE ON __ __ STATEMENTS DEPDNING ON WHAT ON IS SELECTED
	$(document.body).on('change', '#editevent-recurs-on-plus', function(e) {
		var val = $(this).val(); //Get selected ON value
		if (val=="first"||val=="second"||val=="third"||val=="fourth"||val=="last") { //First, second, third, or fourth selected, show 2nd <select>
			$("#editevent-recurs-on2-select").show(); //Show 2nd <select>
			$("#editevent-recurs-on2-days").hide(); //Hide Day # textfield
		}
		else if (val=="day") { //Day was selected
			$("#editevent-recurs-on2-select").hide(); //Hide 2nd <select>
			$("#editevent-recurs-on2-days").show(); //Show Day # textfield
		}
		else {
			notify("Invalid <strong>Repeats</strong> value selected.", "error");
		}
	});


	// ANY TIME SOMETHING WITH .editevent-recurs-summarytemp-change IS CHANGED, UPDATE REPEATS SUMMARY
	$(document.body).on('change', '.editevent-recurs-summarytemp-change', function(e) {
		if ($("#editevent-recurs").is(":checked")) { //Recurring event
			updateRepeatsSummary();
		}
	});



	// CHANGE END DATE NEVER/AFTER/BY MORE PRECISE ADDITION
	$(document.body).on('change', '#editevent-recurs-ends', function(e) {
		var val = $(this).val(); //Get selected "Ends Never/After/By" value
		if (val=="never") {
			$("#editevent-recurs-ends-after-container").hide(); //Hide After "_ occurences" textfield and text
			$("#editevent-recurs-ends-by-container").hide(); //Hide By Popup Calendar
		}
		else if (val=="after") {
			$("#editevent-recurs-ends-after-container").show(); //Show After "_ occurences" textfield and text
			$("#editevent-recurs-ends-by-container").hide(); //Hide By Popup Calendar
		}
		else if (val=="by") {
			$("#editevent-recurs-ends-after-container").hide(); //Hide After "_ occurences" textfield and text
			$("#editevent-recurs-ends-by-container").css('display','inline'); //Show By Popup Calendar
		}
		else {
			notify("Invalid <strong>Ends on</strong> value selected.", "error");
		}
	});

	//CHANGE WEEKLY DAY ON TIMEFRAMES
	$(document.body).on('click', '.editevent-recurs-on-week', function() {
		var content = "";
		$(".editevent-recurs-on-week").each(function() {
			if ($(this).is(":checked")) { //Checkbox is checked - Show it's Day's timeframe input fields
				var checkboxDay = $(this).val(); //Returns a lowercase string day (e.g. sunday, monday, tuesday, etc.)
				$("#editevent-recurs-on-"+checkboxDay+"-timeframe").show();
			}
			else {
				var checkboxDay = $(this).val(); //Returns a lowercase string day (e.g. sunday, monday, tuesday, etc.)
				$("#editevent-recurs-on-"+checkboxDay+"-timeframe").hide();
			}
		})
	})


	//CHANGE WEEKLY DAY ON...FOR VALUES
	$(document.body).on('focusout', '#editevent-recurs-on-week-daytimeframe .timepicker', function() {
		var curContent = $(this).val();
		var defaultTime = ($(this).hasClass("start") ? $("#editevent-starttime").val() : $("#editevent-endtime").val()); //Default Start/End time value
		if (curContent.match(/^\d{1,2}:\d\d(a|p)m$/)) { //Match 3:32am or 12:32pm
		}
		else { //Textfield is blank or contains invalid format, reset it to default value
			$(this).val(defaultTime);
		}
		$(this).trigger('change');
	});

	// OPTIONS FOR EVERY/ON <TR>s //

	function printEveryDay(defaultEvery) {
		//Default -> Every 1 day
		if (isnullorundef(defaultEvery)) {
			defaultEvery = 1;
		}
		defaultEvery = parseInt(defaultEvery);
		var content = 	'<td>Every:</td>'+
						'<td>'+
							'<input id="editevent-recurs-every" class="editevent-recurs-summarytemp-change inline onclick-selecttext textfield tiny" value="'+defaultEvery+'" type="text"> day(s)'+
						'</td>';
		$("#editevent-recurs-every-container").html(content);
		$("#editevent-recurs-on-container").html(""); //Hide On <tr>
		$("#editevent-recurs-on-week-daytimeframe-container").html(""); //Hide Weekly For <input> textfields
	}

	function printEveryWeek(defaultEvery) {
		//Default -> Every 1 week
		if (isnullorundef(defaultEvery)) {
			defaultEvery = 1;
		}
		defaultEvery = parseInt(defaultEvery);
		var content = 	'<td>Every:</td>'+
						'<td>'+
							'<input id="editevent-recurs-every" class="editevent-recurs-summarytemp-change inline onclick-selecttext textfield tiny" value="'+defaultEvery+'" type="text"> week(s)'+
						'</td>';
		$("#editevent-recurs-every-container").html(content);
	}
	function printOnWeek(daysOfWeek) {
		var defaultStartTime = $("#editevent-starttime").val();
		var defaultEndTime = $("#editevent-endtime").val();

		var sundaySelected;
		var mondaySelected;
		var tuesdaySelected;
		var wednesdaySelected;
		var thursdaySelected;
		var fridaySelected;
		var saturdaySelected;
		var sundayStart;
		var mondayStart;
		var tuesdayStart;
		var wednesdayStart;
		var thursdayStart;
		var fridayStart;
		var saturdayStart;
		var sundayEnd;
		var mondayEnd;
		var tuesdayEnd;
		var wednesdayEnd;
		var thursdayEnd;
		var fridayEnd;
		var saturdayEnd;

		//Default -> Day of Week selected is whatever day the currently user-selected event Start Date is
		if (isnullorundef(daysOfWeek)||daysOfWeek.length==0) {
			var parts = $("#editevent-startdate").val().split('/');
			var date = new Date(parts[2],parts[0]-1,parts[1]).getDay();
			if (date===0) {
				sundaySelected = true;
				sundayStart = defaultStartTime; 
				sundayEnd = defaultEndTime;
			}
			else if (date===1) {
				mondaySelected = true;
				mondayStart = defaultStartTime; 
				mondayEnd = defaultEndTime;
			}
			else if (date===2) {
				tuesdaySelected = true;
				tuesdayStart = defaultStartTime; 
				tuesdayEnd = defaultEndTime;
			}
			else if (date===3) {
				wednesdaySelected = true;
				wednesdayStart = defaultStartTime; 
				wednesdayEnd = defaultEndTime;
			}
			else if (date===4) {
				thursdaySelected = true;
				thursdayStart = defaultStartTime; 
				thursddayEnd = defaultEndTime;
			}
			else if (date===5) {
				fridaySelected = true;
				fridayStart = defaultStartTime; 
				fridayEnd = defaultEndTime;
			}
			else if (date===6) {
				saturdaySelected = true;
				saturdayStart = defaultStartTime; 
				saturdayEnd = defaultEndTime;
			}
		}
		else { //Array of default values to fill
			for (var i = 0; i<daysOfWeek.length; i++) {
				if (parseInt(daysOfWeek[i][0])===0) { sundaySelected = true; sundayStart = moment.unix(daysOfWeek[i][1]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); sundayEnd = moment.unix(daysOfWeek[i][2]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); }
				if (parseInt(daysOfWeek[i][0])===1) { mondaySelected = true; mondayStart = moment.unix(daysOfWeek[i][1]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); mondayEnd = moment.unix(daysOfWeek[i][2]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); }
				if (parseInt(daysOfWeek[i][0])===2) { tuesdaySelected = true; tuesdayStart = moment.unix(daysOfWeek[i][1]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); tuesdayEnd = moment.unix(daysOfWeek[i][2]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); }
				if (parseInt(daysOfWeek[i][0])===3) { wednesdaySelected = true; wednesdayStart = moment.unix(daysOfWeek[i][1]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); wednesdayEnd = moment.unix(daysOfWeek[i][2]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); }
				if (parseInt(daysOfWeek[i][0])===4) { thursdaySelected = true; thursdayStart = moment.unix(daysOfWeek[i][1]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); thursdayEnd = moment.unix(daysOfWeek[i][2]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); }
				if (parseInt(daysOfWeek[i][0])===5) { fridaySelected = true; fridayStart = moment.unix(daysOfWeek[i][1]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); fridayEnd = moment.unix(daysOfWeek[i][2]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); }
				if (parseInt(daysOfWeek[i][0])===6) { saturdaySelected = true; saturdayStart = moment.unix(daysOfWeek[i][1]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); saturdayEnd = moment.unix(daysOfWeek[i][2]).subtract(moment.unix(daysOfWeek[i][1]).utcOffset(), 'm').format("h:mma"); }
			}
		}
		var somethingSelected = (sundaySelected||mondaySelected||tuesdaySelected||wednesdaySelected||thursdaySelected||fridaySelected||saturdaySelected);
		var content = 	'<td>On:</td>'+
						'<td>'+
							'<label><input id="editevent-recurs-on-sunday" class="editevent-recurs-summarytemp-change editevent-recurs-on-week" type="checkbox"'+(sundaySelected ? " checked" : "")+' value="sunday">Sun</label>'+
							'<label><input id="editevent-recurs-on-monday" class="editevent-recurs-summarytemp-change editevent-recurs-on-week" type="checkbox"'+(mondaySelected ? " checked" : "")+' value="monday">Mon</label>'+
							'<label><input id="editevent-recurs-on-tuesday" class="editevent-recurs-summarytemp-change editevent-recurs-on-week" type="checkbox"'+(tuesdaySelected ? " checked" : "")+' value="tuesday">Tue</label>'+
							'<label><input id="editevent-recurs-on-wednesday" class="editevent-recurs-summarytemp-change editevent-recurs-on-week" type="checkbox"'+(wednesdaySelected ? " checked" : "")+' value="wednesday">Wed</label>'+
							'<label><input id="editevent-recurs-on-thursday" class="editevent-recurs-summarytemp-change editevent-recurs-on-week" type="checkbox"'+(thursdaySelected ? " checked" : "")+' value="thursday">Thu</label>'+
							'<label><input id="editevent-recurs-on-friday" class="editevent-recurs-summarytemp-change editevent-recurs-on-week" type="checkbox"'+(fridaySelected ? " checked" : "")+' value="friday">Fri</label>'+
							'<label><input id="editevent-recurs-on-saturday" class="editevent-recurs-summarytemp-change editevent-recurs-on-week" type="checkbox"'+(saturdaySelected ? " checked" : "")+' value="saturday">Sat</label>'+
						'</td>';
		if (!RecursEventObj.getAllDay()) {
			var contentDayTimeFrame = 	'<td>For:</td>'+
										'<td id="editevent-recurs-on-week-daytimeframe" class="'+(somethingSelected ? "" : " display-none")+'">'+
											'<div id="editevent-recurs-on-sunday-timeframe" class="datepair'+(sundaySelected ? "" : " display-none")+'">Sunday: <input class="center constricted editevent-recurs-summarytemp-change inline small start textfield timepicker" type="text" value="'+(sundaySelected ? sundayStart : defaultStartTime)+'"> to <input class="center constricted editevent-recurs-summarytemp-change inline small end textfield timepicker" type="text" value="'+(sundaySelected ? sundayEnd : defaultEndTime)+'"></div>'+
											'<div id="editevent-recurs-on-monday-timeframe" class="datepair'+(mondaySelected ? "" : " display-none")+'">Monday: <input class="center constricted editevent-recurs-summarytemp-change inline small start textfield timepicker" type="text" value="'+(mondaySelected ? mondayStart : defaultStartTime)+'"> to <input class="center constricted editevent-recurs-summarytemp-change inline small end textfield timepicker" type="text" value="'+(mondaySelected ? mondayEnd : defaultEndTime)+'"></div>'+
											'<div id="editevent-recurs-on-tuesday-timeframe" class="datepair'+(tuesdaySelected ? "" : " display-none")+'">Tuesday: <input class="center constricted editevent-recurs-summarytemp-change inline small start textfield timepicker" type="text" value="'+(tuesdaySelected ? tuesdayStart : defaultStartTime)+'"> to <input class="center constricted editevent-recurs-summarytemp-change inline small end textfield timepicker" type="text" value="'+(tuesdaySelected ? tuesdayEnd : defaultEndTime)+'"></div>'+
											'<div id="editevent-recurs-on-wednesday-timeframe" class="datepair'+(wednesdaySelected ? "" : " display-none")+'">Wednesday: <input class="center constricted editevent-recurs-summarytemp-change inline small start textfield timepicker" type="text" value="'+(wednesdaySelected ? wednesdayStart : defaultStartTime)+'"> to <input class="center constricted editevent-recurs-summarytemp-change inline small end textfield timepicker" type="text" value="'+(wednesdaySelected ? wednesdayEnd : defaultEndTime)+'"></div>'+
											'<div id="editevent-recurs-on-thursday-timeframe" class="datepair'+(thursdaySelected ? "" : " display-none")+'">Thursday: <input class="center constricted editevent-recurs-summarytemp-change inline small start textfield timepicker" type="text" value="'+(thursdaySelected ? thursdayStart : defaultStartTime)+'"> to <input class="center constricted editevent-recurs-summarytemp-change inline small end textfield timepicker" type="text" value="'+(thursdaySelected ? thursdayEnd : defaultEndTime)+'"></div>'+
											'<div id="editevent-recurs-on-friday-timeframe" class="datepair'+(fridaySelected ? "" : " display-none")+'">Friday: <input class="center constricted editevent-recurs-summarytemp-change inline small start textfield timepicker" type="text" value="'+(fridaySelected ? fridayStart : defaultStartTime)+'"> to <input class="center constricted editevent-recurs-summarytemp-change inline small end textfield timepicker" type="text" value="'+(fridaySelected ? fridayEnd : defaultEndTime)+'"></div>'+
											'<div id="editevent-recurs-on-saturday-timeframe" class="datepair'+(saturdaySelected ? "" : " display-none")+'">Saturday: <input class="center constricted editevent-recurs-summarytemp-change inline small start textfield timepicker" type="text" value="'+(saturdaySelected ? saturdayStart : defaultStartTime)+'"> to <input class="center constricted editevent-recurs-summarytemp-change inline small end textfield timepicker" type="text" value="'+(saturdaySelected ? saturdayEnd : defaultEndTime)+'"></div>'+
										'</td>';
		}
		$("#editevent-recurs-on-container").html(content);
		$("#editevent-recurs-on-week-daytimeframe-container").show().html(contentDayTimeFrame);
		//Trigger change for each datepair timepicker, so that values are checked by API automatically (e.g. start val < end val)
		$("#editevent-recurs-on-week-daytimeframe .editevent-recurs-summarytemp-change").trigger('change');
		init_datepickers(); //Initialize Timepickers
	}

	function printEveryMonth(defaultEvery) {
		//Default -> Every 1 month
		if (isnullorundef(defaultEvery)) {
			defaultEvery = 1;
		}
		defaultEvery = parseInt(defaultEvery);
		var content = 	'<td>Every:</td>'+
							'<td>'+
								'<input id="editevent-recurs-every" class="editevent-recurs-summarytemp-change inline onclick-selecttext textfield tiny" value="'+defaultEvery+'" type="text"> month(s)'+
							'</td>'+
						'</td>';
		$("#editevent-recurs-every-container").html(content);
	}
	function printEveryYear(defaultEvery) {
		//Default -> Every 1 year
		if (isnullorundef(defaultEvery)) {
			defaultEvery = 1;
		}
		defaultEvery = parseInt(defaultEvery);
		var monthid = parseInt($("#editevent-startdate").val().split("/")[0])-1; //0-11, January...December
		var content = 	'<td>Every:</td>'+
						'<td>'+
							'<input id="editevent-recurs-every" class="editevent-recurs-summarytemp-change inline onclick-selecttext textfield tiny" value="'+defaultEvery+'" type="text"> year(s) on '+
							months[monthid]+ //Month name of Start Date
							'<input id="editevent-recurs-every-month" value="'+monthid+'" type="hidden">'+
						'</td>';
		$("#editevent-recurs-every-container").html(content);
	}
	function printOnMonthAndYear(dayOccurrenceInMonth, dayOfWeek, dayOfMonth) {
		//Default -> Day #, 1
		if (isnullorundef(dayOccurrenceInMonth)) {
			dayOccurrenceInMonth = "*";
		}
		if (isnullorundef(dayOfWeek)) {
			dayOfWeek = 0;
		}
		if (isnullorundef(dayOfMonth)) {
			dayOfMonth = 1;
		}
		dayOfWeek = parseInt(dayOfWeek);
		dayOfMonth = parseInt(dayOfMonth);

		var content = 	'<td>On:</td>'+
						'<td>'+
							'<select id="editevent-recurs-on-plus" class="editevent-recurs-summarytemp-change">'+
								'<option value="day"'+(dayOccurrenceInMonth==="*"||dayOccurrenceInMonth==="" ? " selected" : "")+'>Day #</option>'+
								'<option disabled>───</option>'+
								'<option value="first"'+(parseInt(dayOccurrenceInMonth)===1 ? " selected" : "")+'>First</option>'+
								'<option value="second"'+(parseInt(dayOccurrenceInMonth)===2 ? " selected" : "")+'>Second</option>'+
								'<option value="third"'+(parseInt(dayOccurrenceInMonth)===3 ? " selected" : "")+'>Third</option>'+
								'<option value="fourth"'+(parseInt(dayOccurrenceInMonth)===4 ? " selected" : "")+'>Fourth</option>'+
								'<option value="last"'+(parseInt(dayOccurrenceInMonth)===5 ? " selected" : "")+'>Last</option>'+
							'</select>'+
							'<select id="editevent-recurs-on2-select" class="editevent-recurs-summarytemp-change'+(dayOccurrenceInMonth==="*"||dayOccurrenceInMonth==="" ? " display-none" : "")+'"">'+ //Display-none if this is a Day # default
								'<option value="0"'+(dayOfWeek===0 ? " selected" : "")+'>Sunday</option>'+
								'<option value="1"'+(dayOfWeek===1 ? " selected" : "")+'>Monday</option>'+
								'<option value="2"'+(dayOfWeek===2 ? " selected" : "")+'>Tuesday</option>'+
								'<option value="3"'+(dayOfWeek===3 ? " selected" : "")+'>Wednesday</option>'+
								'<option value="4"'+(dayOfWeek===4 ? " selected" : "")+'>Thursday</option>'+
								'<option value="5"'+(dayOfWeek===5 ? " selected" : "")+'>Friday</option>'+
								'<option value="6"'+(dayOfWeek===6 ? " selected" : "")+'>Saturday</option>'+
							'</select>'+
							'<input id="editevent-recurs-on2-days" class="'+(dayOccurrenceInMonth==="*"||dayOccurrenceInMonth==="" ? "" : "display-none ")+'editevent-recurs-summarytemp-change inline onclick-selecttext textfield tiny" value="'+dayOfMonth+'" type="text">'+
						'</td>';
		$("#editevent-recurs-on-container").html(content);
		$("#editevent-recurs-on-week-daytimeframe-container").hide(); //Hide Weekly For <input> textfields
	}

	//Update Repeats Summary
	function updateRepeatsSummary() {
		RecursEventObj.reset(); //Reset Recurs Event Obj
		var eallday = (($("#editevent-allday").is(":checked")) ? "true" : "false");
		
		if (eallday=="true") { 
			RecursEventObj.setAllDay(true);
		}
		else {
			RecursEventObj.setAllDay(false);
		}

		//Set RecursEventObj starting and ending event blocks
		RecursEventObj.setEventBlockStart(generateUNIXFromDatepickerTimepicker($("#editevent-startdate").val(), $("#editevent-starttime").val(), eallday));
		RecursEventObj.setEventBlockEnd(generateUNIXFromDatepickerTimepicker($("#editevent-enddate").val(), $("#editevent-endtime").val(), eallday));

		//Get Repeats (Day, Week, Month, Year) value
		var repeatStatus = $("#editevent-recurs-repeats").val();
		
		//Get Every value (Integer)
		var every = parseInt($("#editevent-recurs-every").val()); //Integer for Day, Week, Month, Year
		if (every>0) { //Valid user input
		}
		else { //User put in letters or 0, invalid Integer
			every = 1;
			$("#editevent-recurs-every").val(1); //And set value of Every textfield to 1
		}
		
		//Get Ends value (Nothing, Integer, Date)
		var endsval = $("#editevent-recurs-ends").val(); //Never, After, By
		var specificEndVal = "";
		if (endsval=="after") {
			specificEndVal = parseInt($("#editevent-recurs-ends-after").val()); //Integer
			if (specificEndVal>0) { //Valid user input
			}
			else { //User put in letters or 0, invalid Integer
				specificEndVal = 1;
				$("#editevent-recurs-ends-after").val(1); //And set value of After textfield to 1
			}
			RecursEventObj.setEndsVal("after"); //Set Ends Value to "After"
			RecursEventObj.setEndsAfterOccurrences(specificEndVal); //Event ends after _ occurrences
		}
		else if (endsval=="by") {
			specificEndVal = $("#editevent-recurs-ends-by").val(); //Date (MM/DD/YYYY)
			RecursEventObj.setEndsVal("by"); //Set Ends Value to "By"
			RecursEventObj.setEndsByTime(generateUNIXFromDatepickerTimepicker(specificEndVal, "12:00am", true)); //Set UNIX time for the end of the day (the +60*60*24) this event ends on
		}
		else { //End Val is "Never"
			specificEndVal = "never";
			RecursEventObj.setEndsVal("never"); //Set Ends Value to "Never"
		}

		//Show starttime and endtime, since the Weekly Repeats event hides this
		$("#editevent-starttime").show();
		$("#editevent-endtime").show();
		if (repeatStatus=="day") {
			$("#editevent-recurs-summarytemp").text(repeatsSummaryDay(every));
		}
		else if (repeatStatus=="week") {

			var onSun = $("#editevent-recurs-on-sunday").is(":checked");
			var onMon = $("#editevent-recurs-on-monday").is(":checked");
			var onTue = $("#editevent-recurs-on-tuesday").is(":checked");
			var onWed = $("#editevent-recurs-on-wednesday").is(":checked");
			var onThu = $("#editevent-recurs-on-thursday").is(":checked");
			var onFri = $("#editevent-recurs-on-friday").is(":checked");
			var onSat = $("#editevent-recurs-on-saturday").is(":checked");
			
			if (RecursEventObj.getAllDay()) {
				var startSun = "12:00am";
				var startMon = "12:00am";
				var startTue = "12:00am";
				var startWed = "12:00am";
				var startThu = "12:00am";
				var startFri = "12:00am";
				var startSat = "12:00am";

				var endSun = "12:00pm";
				var endMon = "12:00pm";
				var endTue = "12:00pm";
				var endWed = "12:00pm";
				var endThu = "12:00pm";
				var endFri = "12:00pm";
				var endSat = "12:00pm";
			}
			else { //Not all day
				var startSun = $("#editevent-recurs-on-sunday-timeframe .start.timepicker").val(); //2:00am
				var startMon = $("#editevent-recurs-on-monday-timeframe .start.timepicker").val();
				var startTue = $("#editevent-recurs-on-tuesday-timeframe .start.timepicker").val();
				var startWed = $("#editevent-recurs-on-wednesday-timeframe .start.timepicker").val();
				var startThu = $("#editevent-recurs-on-thursday-timeframe .start.timepicker").val();
				var startFri = $("#editevent-recurs-on-friday-timeframe .start.timepicker").val();
				var startSat = $("#editevent-recurs-on-saturday-timeframe .start.timepicker").val();

				var endSun = $("#editevent-recurs-on-sunday-timeframe .end.timepicker").val();
				var endMon = $("#editevent-recurs-on-monday-timeframe .end.timepicker").val();
				var endTue = $("#editevent-recurs-on-tuesday-timeframe .end.timepicker").val();
				var endWed = $("#editevent-recurs-on-wednesday-timeframe .end.timepicker").val();
				var endThu = $("#editevent-recurs-on-thursday-timeframe .end.timepicker").val();
				var endFri = $("#editevent-recurs-on-friday-timeframe .end.timepicker").val();
				var endSat = $("#editevent-recurs-on-saturday-timeframe .end.timepicker").val();
			}

			var SundayInfo = new Array(onSun, startSun, endSun);
			var MondayInfo = new Array(onMon, startMon, endMon);
			var TuesdayInfo = new Array(onTue, startTue, endTue);
			var WednesdayInfo = new Array(onWed, startWed, endWed);
			var ThursdayInfo = new Array(onThu, startThu, endThu);
			var FridayInfo = new Array(onFri, startFri, endFri);
			var SaturdayInfo = new Array(onSat, startSat, endSat);

			$("#editevent-recurs-summarytemp").text(repeatsSummaryWeek(every, SundayInfo, MondayInfo, TuesdayInfo, WednesdayInfo, ThursdayInfo, FridayInfo, SaturdayInfo, eallday));
		}
		else if (repeatStatus=="month") {
			var onPlus = $("#editevent-recurs-on-plus").val(); //Day, First, Second, Third, Fourth, Last
			var onAddition = parseInt($("#editevent-recurs-on2-select").val()); //0, 1, 2, 3, 4, 5, 6 -> For Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
			var onDays = $("#editevent-recurs-on2-days").val(); //Integer
			$("#editevent-recurs-summarytemp").text(repeatsSummaryMonth(every, onPlus, onAddition, onDays));
		}
		else if (repeatStatus=="year") {
			var onPlus = $("#editevent-recurs-on-plus").val(); //Day, First, Second, Third, Fourth, Last
			var onAddition = parseInt($("#editevent-recurs-on2-select").val()); //0, 1, 2, 3, 4, 5, 6 -> For Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
			var onDays = $("#editevent-recurs-on2-days").val(); //Integer
			var onMonth = $("#editevent-recurs-every-month").val(); //Month # (0-11)
			$("#editevent-recurs-summarytemp").text(repeatsSummaryYear(every, onMonth, onPlus, onAddition, onDays, endsval));
		}
		else {
			notify("Invalid Repeating pattern specificed.", "error");
		}
	}
	function repeatsSummaryDay(every) {
		every = parseInt(every);

		//Every value
		RecursEventObj.setDay(every);

		//No ON value
		
		return RecursEventObj.getSummary();
	}
	function repeatsSummaryWeek(every, SundayInfo, MondayInfo, TuesdayInfo, WednesdayInfo, ThursdayInfo, FridayInfo, SaturdayInfo, eallday) {
		every = parseInt(every);

		//SundayInfo = array()
		//[0] => True or false (whether this event occurs on this day, in this case Sunday)
		//[1] => Start time (if event occurs)
		//[2] => End time (if event occurs)

		var onSun = SundayInfo[0];
		var onMon = MondayInfo[0];
		var onTue = TuesdayInfo[0];
		var onWed = WednesdayInfo[0];
		var onThu = ThursdayInfo[0];
		var onFri = FridayInfo[0];
		var onSat = SaturdayInfo[0];

		//Every value
		RecursEventObj.setWeek(every);

		var startDate = $("#editevent-startdate").val();
		var endDate = $("#editevent-startdate").val(); //Only 1 day long repeats

		//ON value
		if (onSun) {
			RecursEventObj.setEventBlockStart(generateUNIXFromDatepickerTimepicker(startDate, SundayInfo[1], eallday, "sunday"));
			RecursEventObj.setEventBlockEnd(generateUNIXFromDatepickerTimepicker(endDate, SundayInfo[2], eallday, "sunday"));
			RecursEventObj.addDayOfWeek(0, generateUNIXFromDatepickerTimepicker(startDate, SundayInfo[1], eallday, "sunday"), generateUNIXFromDatepickerTimepicker(endDate, SundayInfo[2], eallday, "sunday"));
		}
		if (onMon) {
			if (!onSun) {
				RecursEventObj.setEventBlockStart(generateUNIXFromDatepickerTimepicker(startDate, MondayInfo[1], eallday, "monday"));
				RecursEventObj.setEventBlockEnd(generateUNIXFromDatepickerTimepicker(endDate, MondayInfo[2], eallday, "monday"));
			}
			RecursEventObj.addDayOfWeek(1, generateUNIXFromDatepickerTimepicker(startDate, MondayInfo[1], eallday, "monday"), generateUNIXFromDatepickerTimepicker(endDate, MondayInfo[2], eallday, "monday"));
		}
		if (onTue) {
			if (!onSun&&!onMon) {
				RecursEventObj.setEventBlockStart(generateUNIXFromDatepickerTimepicker(startDate, TuesdayInfo[1], eallday, "tuesday"));
				RecursEventObj.setEventBlockEnd(generateUNIXFromDatepickerTimepicker(endDate, TuesdayInfo[2], eallday, "tuesday"));
			}
			RecursEventObj.addDayOfWeek(2, generateUNIXFromDatepickerTimepicker(startDate, TuesdayInfo[1], eallday, "tuesday"), generateUNIXFromDatepickerTimepicker(endDate, TuesdayInfo[2], eallday, "tuesday"));
		}
		if (onWed) {
			if (!onSun&&!onMon&&!onTue) {
				RecursEventObj.setEventBlockStart(generateUNIXFromDatepickerTimepicker(startDate, WednesdayInfo[1], eallday, "wednesday"));
				RecursEventObj.setEventBlockEnd(generateUNIXFromDatepickerTimepicker(endDate, WednesdayInfo[2], eallday, "wednesday"));
			}
			RecursEventObj.addDayOfWeek(3, generateUNIXFromDatepickerTimepicker(startDate, WednesdayInfo[1], eallday, "wednesday"), generateUNIXFromDatepickerTimepicker(endDate, WednesdayInfo[2], eallday, "wednesday"));
		}
		if (onThu) {
			if (!onSun&&!onMon&&!onTue&&!onWed) {
				RecursEventObj.setEventBlockStart(generateUNIXFromDatepickerTimepicker(startDate, ThursdayInfo[1], eallday, "thursday"));
				RecursEventObj.setEventBlockEnd(generateUNIXFromDatepickerTimepicker(endDate, ThursdayInfo[2], eallday, "thursday"));
			}
			RecursEventObj.addDayOfWeek(4, generateUNIXFromDatepickerTimepicker(startDate, ThursdayInfo[1], eallday, "thursday"), generateUNIXFromDatepickerTimepicker(endDate, ThursdayInfo[2], eallday, "thursday"));
		}
		if (onFri) {
			if (!onSun&&!onMon&&!onTue&&!onWed&&!onThu) {
				RecursEventObj.setEventBlockStart(generateUNIXFromDatepickerTimepicker(startDate, FridayInfo[1], eallday, "friday"));
				RecursEventObj.setEventBlockEnd(generateUNIXFromDatepickerTimepicker(endDate, FridayInfo[2], eallday, "friday"));
			}
			RecursEventObj.addDayOfWeek(5, generateUNIXFromDatepickerTimepicker(startDate, FridayInfo[1], eallday, "friday"), generateUNIXFromDatepickerTimepicker(endDate, FridayInfo[2], eallday, "friday"));
		}
		if (onSat) {
			if (!onSun&&!onMon&&!onTue&&!onWed&&!onThu&&!onFri) {
				RecursEventObj.setEventBlockStart(generateUNIXFromDatepickerTimepicker(startDate, SaturdayInfo[1], eallday, "saturday"));
				RecursEventObj.setEventBlockEnd(generateUNIXFromDatepickerTimepicker(endDate, SaturdayInfo[2], eallday, "saturday"));
			}
			RecursEventObj.addDayOfWeek(6, generateUNIXFromDatepickerTimepicker(startDate, SaturdayInfo[1], eallday, "saturday"), generateUNIXFromDatepickerTimepicker(endDate, SaturdayInfo[2], eallday, "saturday"));
		}

		//Error checking
		if (!onSun&&!onMon&&!onTue&&!onWed&&!onThu&&!onFri&&!onSat) { //Invalid input, no Day selected
			notify("Invalid input entered for the <strong>On:</strong> value", "error");
			RecursEventObj.reset(); //Clean out RecursEventObj
			return "";
		}

		return RecursEventObj.getSummary();
	}
	function repeatsSummaryMonth(every, onPlus, onAddition, onDays) {
		every = parseInt(every);
		onDays = parseInt(onDays);

		//Every value
		RecursEventObj.setMonth(every);

		//ON value
		if (onPlus=="first"||onPlus=="second"||onPlus=="third"||onPlus=="fourth"||onPlus=="last") { //Day Occurrence in Month
			var numberVersionOfOnPlus = onPlus=="first" ? 1 : onPlus=="second" ? 2 : onPlus=="third" ? 3 : onPlus=="fourth" ? 4 : onPlus=="last" ? 5 : 5;
			var blockStart = moment.unix(RecursEventObj.getEventBlockStart()).day(onAddition); //Adjust day to the nth ____ that the user selects
			var blockEnd = moment.unix(RecursEventObj.getEventBlockEnd()).day(onAddition); //Adjust day to the nth ____ that the user selects
			RecursEventObj.addDayOfWeek(onAddition, blockStart, blockEnd);
			RecursEventObj.setDayOccurrenceInMonth(numberVersionOfOnPlus);
		}
		else if (onPlus=="day") { //Day #
			RecursEventObj.setDayOfMonth(onDays);
		}
		else { //Error - Invalid input
			notify("Invalid input entered for the <strong>On:</strong> value", "error");
			RecursEventObj.reset(); //Clean out RecursEventObj
			return "";
		}

		return RecursEventObj.getSummary();
	}
	function repeatsSummaryYear(every, onMonth, onPlus, onAddition, onDays, endsval, specificEndVal) {
		every = parseInt(every);
		onDays = parseInt(onDays);

		//Every value
		RecursEventObj.setThisMonth(onMonth);
		RecursEventObj.setYear(every);

		//ON value
		if (onPlus=="first"||onPlus=="second"||onPlus=="third"||onPlus=="fourth"||onPlus=="last") {
			var numberVersionOfOnPlus = onPlus=="first" ? 1 : onPlus=="second" ? 2 : onPlus=="third" ? 3 : onPlus=="fourth" ? 4 : onPlus=="last" ? 5 : 5;
			var blockStart = moment.unix(RecursEventObj.getEventBlockStart()).day(onAddition); //Adjust day to the nth ____ that the user selects
			var blockEnd = moment.unix(RecursEventObj.getEventBlockEnd()).day(onAddition); //Adjust day to the nth ____ that the user selects
			RecursEventObj.addDayOfWeek(onAddition, blockStart, blockEnd);
			RecursEventObj.setDayOccurrenceInMonth(numberVersionOfOnPlus);
		}
		else if (onPlus=="day") { //Day #
			RecursEventObj.setDayOfMonth(onDays);
		}
		else { //Error - Invalid input
			notify("Invalid input entered for the <strong>On:</strong> value", "error");
			RecursEventObj.reset(); //Clean out RecursEventObj
			return "";
		}

		return RecursEventObj.getSummary();
	}

	function toggleEditEventDateTimeBoxes(startlabel, startdate, starttime, starttoendlabel, enddate, endtime) {
		$("#editevent-start-label").hide();
		$("#editevent-startdate").hide();
		$("#editevent-starttime").hide();
		$("#editevent-start-to-end-label").hide();
		$("#editevent-enddate").hide();
		$("#editevent-endtime").hide();
		if (startlabel) {
			$("#editevent-start-label").show();
		}
		if (startdate) {
			$("#editevent-startdate").show();
		}
		if (starttime) {
			$("#editevent-starttime").show();
		}
		if (starttoendlabel) {
			$("#editevent-start-to-end-label").show();
		}
		if (enddate) {
			$("#editevent-enddate").show();
		}
		if (endtime) {
			$("#editevent-endtime").show();
		}
	}
	//BUTTON DISABLING
	function editevent_startDisable() {
		startDisable(true, ["#editevent-save", "#editevent-save2", "#editevent-delete", "#editevent-remove"]);
	}
	function editevent_endDisable() {
		endDisable(true, ["#editevent-save", "#editevent-save2", "#editevent-delete", "#editevent-remove"]);
	}

});	