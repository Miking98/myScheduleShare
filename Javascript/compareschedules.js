$(document).ready(function() {
	
	// USERS WE ARE CURRENTLY GETTING SCHEDULES OF //

	var compareSchedulesPersonObjs = ($("#compareschedules-personobjs").length>0) ? $.parseJSON(atob($("#compareschedules-personobjs").val())) : null; //JSON Object of Person whose schedules we're comparing
	var userIDs = new Array(); //Array of user IDs

	if (!isnullorundef(compareSchedulesPersonObjs)&&compareSchedulesPersonObjs.length>0) {
		for (var i = 0; i<compareSchedulesPersonObjs.length; i++) {
			userIDs.push(compareSchedulesPersonObjs[i].id);
		}
	}


	//
	//
	// TAGSLIST OF USERS WE WANT TO GET THE SCHEDULES OF
	//
	//

	//Toggle TAGSLIST visibility
	$(document.body).on('click', '#compareschedules-meta-toggle', function() {
		if ($(this).text()=="Compare Other Schedules") {
			//Now, the meta TAGSLIST will be shown
			$(this).text("Hide Toolbar").removeClass("action").addClass("danger");
		}
		else {
			$(this).text("Compare Other Schedules").addClass("action").removeClass("danger");
		}
		//Toggle TAGSLIST and People Groups Dashboard
		$("#compareschedules-meta").toggle();
		$("#content-content_peoplegroupsdashboard").toggle();
		//Automatically fill TAGSLIST with users whose schedules we're currently viewing
		$("#compareschedules-tagslist").select2("data", compareSchedulesPersonObjs);
		//Resize Full Calendar
		$("#compareschedules").fullCalendar("option", "height", compareschedules_calcFullCalendarHeight());
	});

	//Select2 TAGSLIST for selecting people to compare schedules of

	//Initialize User selection TAGSLIST
	init_compareschedules_tagslist();

	//Reset button - Remove all tags
	$(document.body).on("click", "#compareschedules-tagslist-removeAll", function() {
		$("#compareschedules-tagslist").select2("val", "");
	});

	//Create Group button - Trigger People's Dashboard's Create Group Button
	$(document.body).on('click', '#compareschedules-tagslist-create', function(e) {
		$("#peoplegroups-toggle-create").trigger('click'); //Trigger "Create a group" toggle\
	});

	//Compare Schedules button - Refetch Full Calendar based on updated user IDs
	$(document.body).on("click", "#compareschedules-tagslist-submit", function(e) {
		//Reset userIDs and Person Objects of users we want to include when we fetch the Full Calendar
		userIDs = [];
		compareSchedulesPersonObjs = [];

		//GET selected User information
		compareSchedulesPersonObjs = $("#compareschedules-tagslist").select2('data'); //Selected tags user data
		
		// 1. Store User IDs
		// 2. Generate Name+Color swatch calendar title
		// 3. Show Full Calendar (if hidden)
		// 4. Refetch Full Calendar
		if (!isnullorundef(compareSchedulesPersonObjs)&&compareSchedulesPersonObjs.length>0) {
			//Get userIDs in convenient userIDs array()
			for (var i = 0; i<compareSchedulesPersonObjs.length; i++) {
				userIDs.push(compareSchedulesPersonObjs[i].id);
			}
			//Generate <h2>Name+Color swatch</h2>
			var stringOfUserNames = "";
			for (var i = 0; i<compareSchedulesPersonObjs.length; i++) {
				if (i>0) {
					stringOfUserNames += ', ';
				}
				stringOfUserNames += '<div id="compareschedules-name-colorswatch-'+preventxss(compareSchedulesPersonObjs[i].id)+'" class="color-swatch"></div>'+
										'<a class="compareschedules-name" href="scheduleview.php?userid='+preventxss(compareSchedulesPersonObjs[i].id)+'" class="action-link">'+
											preventxss(compareSchedulesPersonObjs[i].name)+
										'</a>';
			}

			//Set title of Name+Color swatch
			$("#compareschedules-name-colorswatch-container").html(stringOfUserNames);
			//Show Full Calendar
			$("#compareschedules-container").removeClass('fullcalendar-container-display-none');
			//Refetch Full Calendar events
			$("#compareschedules").fullCalendar("refetchEvents");
		}
	});



	//
	//
	//
	// ACTUAL FULL CALENDAR SCHEDULE & SCHEDULING FUNCTIONALITY
	//
	//
	//

	//Tooltip
	compareschedulestooltip = $('<div/>').qtip({
		id: 'compareschedules-tooltip',
		style: 'qtip-addevent',
		content: {
			text: ' ',
        	title: '',
        	buttton: ''
		},
		position: {
			my: 'bottom center',
			at: 'center',
			target: 'mouse',
			viewport: $('#compareschedules'),
			adjust: {
				mouse: false,
				scroll: false,
				screen: true
			}
		},
		show: false,
		hide: false
	}).qtip('api');
	
	//Assign each eventID with a unique class to a series of colors (for multi-colored events)
	var eventIDtoColor = []; //[i][0] -> Event ID, [i][1] -> array of BG colors, e.g. [BG Color 1, BG Color 2, etc.]

	//Full calendar
	//----- Make global
    compareschedules = $('#compareschedules').fullCalendar({
		header: {
			left: 'prev,next today',
			center: 'title',
			right: 'agendaDay,agendaWeek,month'
		},
		defaultView: 'agendaWeek',
		weekends: true,
		editable: false,
		eventLimit: true, // allow "more" link when too many events
		fixedWeekCount: false,
		height: compareschedules_calcFullCalendarHeight(),
		allDaySlot: true,
		allDayText: '',
		slotDuration: '00:30:00', //30 Minute intervals
		snapDuration: '00:10:00', //Snap events to occur at 10-minute intervals
		slotEventOverlap: true,
		minTime: '00:00:00',
		scrollTime: '06:00:00',
		timezone: false,
		windowResize: function(view) {
			//Readjust height to fit viewport
			$("#compareschedules").fullCalendar('option', 'height', compareschedules_calcFullCalendarHeight()); //Adjust height on window resize
			
			//Re-set Current Time Line
			setCurrentTimeLine(view);
		},
		events: function(start, end, timezone, callback) {
			$.ajax({
				url: '../process/return_scheduleevents.php',
				type: 'POST',
				dataType: "JSON",
				data: {
					starttime: start.unix(),
					endtime: end.unix(),
					userids: userIDs,
					oneOfEachSharedEvent: "true",
					includeCurrentUserInSharedWith: "true"
				},
				success: function(eventdata) {
					var events = [];

					//EVENT BG COLORING

					//LOCAL
					//BGColor Arrays - For coloring in events specific to each user
					var mapUserIDtoBGColor = []; //Map user ID's to a unique BGColor
					var bgColorIndex = 0; //For assigning unique BG Colors to every person's schedule

					//GLOBAL
					//Reset Event ID -> Color mapping, since we might be fetching different users's (with different unique colors) events
					eventIDtoColor = [];
					eventIDtoColorindex = 0;

					//Assign each user to a color
					for (var i = 0; i<userIDs.length; i++) { //User hasn't been assigned a value yet
						mapUserIDtoBGColor[userIDs[i]] = BGColors[bgColorIndex];
						$("#compareschedules-name-colorswatch-"+userIDs[i]).css("background-color", mapUserIDtoBGColor[userIDs[i]]); //Change this user's color swatch near his name
						bgColorIndex++; //Increment BGColor index for next person
					}
					if (!isnullorundef(eventdata)) { //Schedule Events were returned
						events = $.map(eventdata, function(obj) {
							var ISOStartTime = moment.unix(obj.starttime).toISOString();
							var ISOEndTime = moment.unix(obj.endtime).toISOString();

							//Map event IDs to color
							eventIDtoColor[eventIDtoColorindex] = [];
							eventIDtoColor[eventIDtoColorindex][0] = obj.id;
							eventIDtoColor[eventIDtoColorindex][1] = [];

							var bgColor = ""; //BGColor
							var textColor = "#333333"; //White or black text

							//Shared With
							var sharedwithlist = ""; //String of people's names who share this event
							if (isnullorundef(obj.sharedwith)||obj.sharedwith.length==0) {
								sharedwithlist = "None"; //No one shares this event
							}
							else {
								//For public events
								if (obj.visibility==1) {
									for (var i = 0; i<obj.sharedwith.length; i++) {
										sharedwithlist += '<div class="info-item"><a href="scheduleview.php?userid='+castInt(obj.sharedwith[i].id)+'">'+preventxss(obj.sharedwith[i].name)+'</a></div>';
										//Add color stripe for this user if is in userIDs of people whose schedules we are fetching
										if (userIDs.indexOf(obj.sharedwith[i].id)!=-1) { //This sharedwith userID is a userID whose schedule is currently being fetched
											bgColor = mapUserIDtoBGColor[obj.sharedwith[i].id]; //Different Event Background color for every person
											eventIDtoColor[eventIDtoColorindex][1].push(bgColor); //Push BGColor for this specific user who shares this event
										}
									}
								}
								else { //For private events
									for (var i = 0; i<obj.sharedwith.length; i++) {
										sharedwithlist += '<div class="info-item"><a href="scheduleview.php?userid='+castInt(obj.sharedwith[i].id)+'">'+preventxss(obj.sharedwith[i].name)+'</a> | '+preventxss(obj.sharedwith[i].goingStatusName)+'</div>';
										//Add color stripe for this user if is in userIDs of people whose schedules we are fetching
										if (userIDs.indexOf(obj.sharedwith[i].id)!=-1) { //This sharedwith userID is a userID whose schedule is currently being fetched
											bgColor = mapUserIDtoBGColor[obj.sharedwith[i].id]; //Different Event Background color for every person
											eventIDtoColor[eventIDtoColorindex][1].push(bgColor); //Push BGColor for this specific user who shares this event
										}
									}
								}
							}
							//Increase eventIDtoColorIndex counter
							eventIDtoColorindex++;

							//Event Series
							var eventserieslist = "";
							if (isnullorundef(obj.eventseries)||obj.eventseries.length==0) {
								eventserieslist = "None"; //This event doesn't belong to any series
							}
							else {
								for (var i = 0; i<obj.eventseries.length; i++) {
									eventserieslist += '<div class="info-item"><a href="eventseriesview.php?seriesid='+preventxss(obj.eventseries[i].id)+'">'+preventxss(obj.eventseries[i].name)+'</a></div>';
									/* Show max of 3 series
									if (i==2) {
										eventserieslist += '+'+(eventseries.length-3)+' more...';
										break;
									} */
								}
							}

							//COLORING CLASSES
							var eventClasses = "fullcalendar-scheduleevent-colorstripes-"+obj.id;
							
							//If ends before Current Time, shade in Hex BGColor
							if (obj.endtime<moment().add(moment().utcOffset()).unix()) {
								eventClasses += " fullcalendar-scheduleevent-colorstripes-shaded";
							}

							//If private, add meeting-class
							if (obj.visibility==0) {
								//eventClasses += " fullcalendar-scheduleevent-meeting fullcalendar-scheduleevent-meeting-color-"+obj.color;
							}

							return {
								id: preventxss(castInt(obj.id)),
								belongstoID: (!isnullorundef(obj.belongsto) ? castInt(obj.belongsto.id) : null),
								belongstoname: (!isnullorundef(obj.belongsto) ? preventxss(obj.belongsto.name) : null),
								createdbyID: (!isnullorundef(obj.createdby) ? castInt(obj.createdby.id) : null),
								createdbyname: (!isnullorundef(obj.createdby) ? preventxss(obj.createdby.name) : null),
								teacherID: (!isnullorundef(obj.teacher) ? castInt(obj.teacher.id) : null),
								teachername: (!isnullorundef(obj.teacher) ? preventxss(obj.teacher.name) : null),
								visibility: castInt(obj.visibility),
								className: eventClasses,
								title: preventxss(obj.name),
								start: ISOStartTime, //Safe - from Moment JS
								end: ISOEndTime, //Safe - from Moment JS
								allDay: castInt(obj.allday),
								recur: castInt(obj.recur),
								descrip: preventxss(obj.description),
								color: preventxss(bgColor),
								borderColor: preventxss("#000000"),
								textColor: preventxss(textColor), 
								tagid: castInt(obj.tagid),
								tagname: preventxss(obj.tagname),
								sharedwith: sharedwithlist, //Safe - already filtered
								eventseries: eventserieslist, //Safe - already filtered
								perms_modify: castInt(obj.perms_modify),
								perms_seeothers: castInt(obj.perms_seeothers), 
								perms_inviteothers: castInt(obj.perms_inviteothers)
							}
						});
					}
					callback(events);
				},
				error: function() {
					notify("There was an error connecting to the database. Please refresh the page or try again later.", "error");
					end_loadingicon();
				}
			});
		},
		viewRender: function (view, element) {
			//TRIGGERED after calendar is rendered, but before events are

			//Add custom buttons to Header
			addCustomButtons("compareschedules", view, element, true, true);

			//Initial set timeline
			setCurrentTimeLine(view);

			//Hide any active tooltips when Date Range is changed
			compareschedulestooltip.hide();

			//Update current timeline
			//Every minute for accurate time
			var timelineInterval = window.setInterval(setCurrentTimeLine(view), 100000); //Every 1 minutes, update Current Time Line position
		},
		loading: function(isLoading) {
			if (isLoading) {
				print_loadingicon();
			}
			else {
				end_loadingicon();
			}
		},
		selectable: true,
		selectHelper: true,
		unselectCancel: "#compareschedules-tooltip, #createevent-tooltip, .sp-container",
		select: function(startDate, endDate, event, view) {
			var allDay = !endDate.hasTime(); //HasTime() Returns TRUE if this event is not All Day
			var eventdate = humanReadableDateRange(startDate, endDate, allDay);
			//User wants to schedule a meeting with these people
			var content = '<div id="createevent-tooltip" class="qtip-content">'+
							'<h3>Create a new event!</h3>'+
							'<input id="createevent-tooltip-eventname" class="largefont onclick-selecttext textfield tooltip tooltip-focus" placeholder="Event name" type="text" value="New event" title="Name of event (e.g. Meeting with Math teacher)" />'+
							'<table>'+
								'<tr>'+
									'<td>When:</td>'+
									'<td>'+preventxss(eventdate)+'<input id="createevent-tooltip-startdate" type="hidden" value="'+castInt(startDate.unix())+'" />'+'<input id="createevent-tooltip-enddate" type="hidden" value="'+castInt(endDate.unix()+1)+'" />'+'<input id="createevent-tooltip-allday" type="hidden" value="'+allDay+'" /></td>'+ //Add one to endDate.unix() in a day b/c fullCalendar says that enddates are exclusive - so 00:00:00 on Friday means the event ends on Thursday
								'</tr>'+
								'<tr>'+
									'<td>Color:</td>'+
									'<td><input id="createevent-tooltip-color" type="text" class="colorpicker" value="#60B044" /></td>'+
								'</tr>'+
								'<tr>';
									if (view.name=="month") { //Allow user to edit time from month view of all day event
			content +=					'<td>Time:</td>'+
										'<td>'+
											'<div>'+
												'<label><input id="createevent-tooltip-allday-checkbox" type="checkbox" value="true" checked>All day</label>'+
												'<div id="createevent-tooltip-time-container" class="display-none">'+
													'<input id="createevent-tooltip-time-starttime" class="center inline small start textfield timepicker" type="text" title="Event\'s start time" value="1:00pm" /> to '+
													'<input id="createevent-tooltip-time-endtime" class="center inline small end textfield timepicker" type="text" title="Event\'s end time" value="1:30pm" />'+
												'</div>'+
											'</div>'+
										'</td>';
									}
			content +=			'</tr>'+
								'<tr id="createevent-tooltip-visibility-container">'+
									'<td>Invited:</td>'+
									'<td><input id="createevent-tooltip-invitedlist" type="hidden"></td>'+
								'</tr>'+
							'</table>'+
							'<div class="createevent-tooltip-item">'+
								'<label><input id="createevent-tooltip-visibility" type="checkbox" checked> Make private</label> <div id="createevent-tooltip-visibility-help" class="tooltip tooltip-hover tooltip_question_mark" title="<u>Only people invited by you</u> will be able to see this event.">?</div></span>'+
							'</div>'+
							'<button id="createevent-submit" class="action btn">Create event!</button>'+
							'<button id="createevent-editevent" class="btn secondary">Edit Event</button>'+
						  '</div>';
			compareschedulestooltip.set({
				'content.text': content
			})
			.reposition(event).show(event);
			init_colorpicker();
			init_tooltipster();
			//Initialize invite list for created event tooltip
			init_fullcalendarcreateeventinvitedlist_tagslist(compareSchedulesPersonObjs);
		},
		eventClick: function(data, event, view) {
			var eventid = data.id;
			var createdbyname = data.createdbyname;
			var startDate = data.start;
			var endDate = data.end;
			var allDay = data.allDay;
			var teacherID = data.teacherID;
			var teacherName = data.teachername;
			var teachername = (teacherID!=0&&!isnullorundef(teacherID) ? '<a href="scheduleview.php?userid='+castInt(teacherID)+'">'+preventxss(teacherName)+'</a>' : "None");
			var tagname = data.tagname;
			var visibility = data.visibility;
			var canSeeOtherGuests = data.perms_seeothers;
			//Tag Name
			if (isnullorundef(tagname)||tagname=="") {
				tagname = "None.";
			}
			//Shared With
			var sharedwith = data.sharedwith;
			if (sharedwith.length==0) {
				sharedwith = "None.";
			}
			if (visibility==0&&canSeeOtherGuests==0) { //Private event and user can't see others invited
				sharedwith = "Guest list hidden.";
			}
			//Event Series
			var eventseries = data.eventseries;
			if (eventseries.length==0) {
				eventseries = "None.";
			}
			var eventdate = humanReadableDateRange(startDate, endDate, allDay);
			var content = '<div id="infoevent-tooltip" class="qtip-content">'+
							'<h2><a href="eventview.php?eventid='+castInt(eventid)+'">'+preventxss(data.title)+'</a></h2>'+
							eventdate+
							'<table>'+
								'<tr>'+
									'<td>'+(visibility==1 ? 'Belongs to' : 'Invited' )+':</td>'+
									'<td><div class="info-list-container scrollable small">'+sharedwith+'</div></td>'+ //Safe - already filtered
								'</tr>'+
								'<tr>'+
									'<td>In Series:</td>'+
									'<td><div class="info-list-container scrollable tiny">'+eventseries+'</div></td>'+ //Safe - already filtered
								'</tr>'+
							'</table>'+
							'<input id="infoevent-eventid" type="hidden" value="'+castInt(eventid)+'">'+
							'<a href="editevent.php?eventid='+castInt(eventid)+'"><button class="btn secondary">Edit Event</button></a>'+
							'<button id="removeevent" class="btn danger">'+(visibility==1 ? 'Remove Event' : 'Cancel Attendance')+'</button>'+								
						'</div>';
			compareschedulestooltip.set({
				'content.text': content
			})
			.reposition(event).show(event);
		},
		eventMouseover: function( event, jsEvent, view ) {
		},
		dayClick: function() { compareschedulestooltip.hide(); },
		eventResizeStart: function() { compareschedulestooltip.hide();},
		eventDragStart: function() { compareschedulestooltip.hide(); },
		eventAfterAllRender: function(view) {
			//Set meetings colors
			init_meetingeventscolor();

			//Set scheduleevent color stripes
			for (var i = 0; i<eventIDtoColor.length; i++) {
				var eventID = eventIDtoColor[i][0]; //Get Event ID
				//Multiple divs may have this class, because of repeating events, yet each occurrence of the repeating event may have different colors, because of shading for already ended events
				$(".fullcalendar-scheduleevent-colorstripes-"+eventID).each(function() {
					var $seElement = $(this);
					var shadeColor = $seElement.hasClass("fullcalendar-scheduleevent-colorstripes-shaded"); //True if this scheduleevent should be shaded, because it has already endd
					var widthOfEachStrip = 100/eventIDtoColor[i][1].length+1; //Divide 100 by # of different BGColors to determine how much % each stripe gets - Add 1 to fill in any gaps due to .0001% off
					var OffsetOfEachStrip = (eventIDtoColor[i][1].length-1>0 ? (100/(eventIDtoColor[i][1].length-1)) : 100); //Minusing 1 seems to get colors to align properly
					var backgroundImage = "";
					var backgroundPosition = "";
					var backgroundSize = "";
					//Color stripes in for this event if shared by multiple users
					for (var g = 0; g<eventIDtoColor[i][1].length; g++) {
						var bgColor = (shadeColor ? shadeHex(eventIDtoColor[i][1][g], 0.85) : eventIDtoColor[i][1][g]);
						backgroundImage += "linear-gradient(to right, "+bgColor+", "+bgColor+")"; //Fill linear-gradient with BGColor for userID #i
						backgroundPosition += ""+OffsetOfEachStrip*g+"% 0px"
						backgroundSize += ""+widthOfEachStrip+"% 100%";
						if (g<eventIDtoColor[i][1].length-1) { //Not last bgColor
							backgroundImage += ", ";
							backgroundPosition += ", ";
							backgroundSize += ", ";
						}
						else { //Last bgColor
							backgroundImage += "";
							backgroundPosition += "";
							backgroundSize += "";
						}
					}
					$seElement.css("background-image", backgroundImage);
					$seElement.css("background-repeat", "no-repeat");
					$seElement.css("background-position", backgroundPosition);
					$seElement.css("background-size", backgroundSize);
				});
			}
		},
		eventLimitClick: function (cellInfo, jsEvent) {
			//Set meetings colors
			init_meetingeventscolor();

			//Set scheduleevent color stripes
			for (var i = 0; i<eventIDtoColor.length; i++) {
				var eventID = eventIDtoColor[i][0]; //Get Event ID
				//Multiple divs may have this class, because of repeating events, yet each occurrence of the repeating event may have different colors, because of shading for already ended events
				cellInfo.dayEl.find(".fullcalendar-scheduleevent-colorstripes-"+eventID).each(function() {
					var $seElement = $(this);
					var shadeColor = $seElement.hasClass("fullcalendar-scheduleevent-colorstripes-shaded"); //True if this scheduleevent should be shaded, because it has already endd
					var widthOfEachStrip = 100/eventIDtoColor[i][1].length+1; //Divide 100 by # of different BGColors to determine how much % each stripe gets - Add 1 to fill in any gaps due to .0001% off
					var OffsetOfEachStrip = (eventIDtoColor[i][1].length-1>0 ? (100/(eventIDtoColor[i][1].length-1)) : 100); //Minusing 1 seems to get colors to align properly
					var backgroundImage = "";
					var backgroundPosition = "";
					var backgroundSize = "";
					//Color stripes in for this event if shared by multiple users
					for (var g = 0; g<eventIDtoColor[i][1].length; g++) {
						var bgColor = (shadeColor ? shadeHex(eventIDtoColor[i][1][g], 0.85) : eventIDtoColor[i][1][g]);
						backgroundImage += "linear-gradient(to right, "+bgColor+", "+bgColor+")"; //Fill linear-gradient with BGColor for userID #i
						backgroundPosition += ""+OffsetOfEachStrip*g+"% 0px"
						backgroundSize += ""+widthOfEachStrip+"% 100%";
						if (g<eventIDtoColor[i][1].length-1) { //Not last bgColor
							backgroundImage += ", ";
							backgroundPosition += ", ";
							backgroundSize += ", ";
						}
						else { //Last bgColor
							backgroundImage += "";
							backgroundPosition += "";
							backgroundSize += "";
						}
					}
					$seElement.css("background-image", backgroundImage);
					$seElement.css("background-repeat", "no-repeat");
					$seElement.css("background-position", backgroundPosition);
					$seElement.css("background-size", backgroundSize);
				});
			}
			return "popover";
		}
	});

	//When any part of document.body is clicked besides tooltips, remove them
	$(document.body).mouseup(function (e) {
		var container = $("#compareschedules-tooltip, #createevent-tooltip");
		if (!container.is(e.target) // if the target of the click isn't the container...
		&& container.has(e.target).length === 0) // ... nor a descendant of the container
		{
			if (!$(".sp-container").is(e.target) //And it isn't the colorpicker in the tooltip
			&& $(".sp-container").has(e.target).length === 0) // ... nor a descendant of the container	// ... nor a descendant of the tooltip's colorpicker
			{
				compareschedulestooltip.hide(); //Hide tooltips
			}
			else {
			}
		}
		else {
		}
	});

	//Toggle Time/All day checkbox and textfields
	$(document.body).on('change', '#createevent-tooltip-allday-checkbox', function() {
		if ($(this).is(":checked")) {
			$("#createevent-tooltip-time-container").hide();
		}
		else {
			$("#createevent-tooltip-time-container").show();
		}
	});

	//Toggle Invited Tagslist
	$(document.body).on('change', '#createevent-tooltip-visibility', function() {
		if ($(this).is(":checked")) {
			$("#createevent-tooltip-visibility-container").show();
		}
		else {
			$("#createevent-tooltip-visibility-container").hide();
		}
	});
	
	//When Enter key is clicked, trigger Create event button
	$(document).keypress(function(e) {
		if (e.which == 13) { //Enter key has been pressed
			if ($("#createevent-tooltip").is(':visible')) { //Event tooltip is currently in focus and visible
				$("#createevent-submit").trigger("click"); //Trigger Create Event button
			}
		}
	});

	//When Create Event button is clicked, create event
	$(document.body).on('click', '#createevent-submit, #createevent-editevent', function() {
		var eid = 0;
		var ename = $("#createevent-tooltip-eventname").val();
		
		//Start, End, All day

		var estart = castInt($("#createevent-tooltip-startdate").val());
		var eend = castInt($("#createevent-tooltip-enddate").val());
		//Check if Month View's time was specified, so event isn't all day
		var monthView = $("#compareschedule").fullCalendar('getView').name=="month"; //True if currently in month view
		if (monthView) {
			var eallday = ($("#createevent-tooltip-allday-checkbox").is(":checked") ? "true" : "false"); //If All Day checkbox exists (so user has option of choosing all day) and checkbox is checked, than All Day event. Otherwise, user chose to make this event NOT all day
			//If NOT All Day AND in Month View, then modify start and end date to the specified time
			if (eallday=="false") {
				var estarttime = $("#createevent-tooltip-time-starttime").val();
				var eendtime = $("#createevent-tooltip-time-endtime").val();
				estart = castInt(estart)+((estarttime.split(":"))[0]*60*60)+(((estarttime.split(":"))[1]).substring(0,2)*60)+((estarttime.split(":"))[0]!=12&&((estarttime.split(":"))[1]).substring(2)=="pm" ? 12*60*60 : 0);
				eend = castInt(eend)-(24*60*60)+((eendtime.split(":"))[0]*60*60)+(((eendtime.split(":"))[1]).substring(0,2)*60)+((eendtime.split(":"))[0]!=12&&((eendtime.split(":"))[1]).substring(2)=="pm" ? 12*60*60 : 0);
			}
		}
		else { //Week view
			var eallday = ($("#createevent-tooltip-allday").val()=="true" ? "true" : "false");
		}
		var erecur = "false";

		//Check if others are invited
		var einvited = $("#createevent-tooltip-invitedlist").val(); //Array of user IDs
		var emeeting = (einvited.length>0 ? "true" : "false"); //If people are invited, then this event is a meeting

		var eteacher = 0;

		//Appearance
		var ecolor = $("#createevent-tooltip-color").spectrum("get").toHexString();
		var evisibility = ($("#createevent-tooltip-visibility").is(":checked") ? "false" : "true"); //NOT Visible if "Make private" checkbox is checked
		
		//Tag
		var enewtag = "";
		var etag = 0;

		//HW and Description
		var ehw = "";
		var edescrip = "";

		//Event series
		var eeventseries = [];

		//We're creating an event from scratch
		var ecreateevent = "true"

		//Redirect to...
		var ertms = "false";
		var eedit = ($(this).attr('id')=="createevent-editevent" ? "true" : "false");

		print_loadingicon();

		editevent(eid, ename, estart, eend, eallday, erecur, emeeting, einvited, eteacher, ecolor, evisibility, enewtag, etag, ehw, edescrip, eeventseries, ecreateevent, ertms, eedit, function(param, wasHandled) {
			if (param.result=="success") { //Success
				var startDate = $("#compareschedules").fullCalendar('getCalendar').moment(moment.unix(estart).utc());
				var endDate = $("#compareschedules").fullCalendar('getCalendar').moment(moment.unix(eend).utc());
				notify("Successfully created meeting for <strong>"+humanReadableDateRange(startDate, endDate, eallday)+"</strong>!", "success");
				refresh_ajaxelements();
			}
			else if (param.result=="dbfailure") {
				notify("Sorry, there was an error trying to create this event.", "error");
			}
			else if (param.result=="dbfailure2") {
				notify("Sorry, there was an error trying to create this event.", "error");
			}
			else if (!wasHandled) {
				notify("Sorry, there was an error.", "error");
			}
			end_loadingicon();
			compareschedulestooltip.hide(); //Hide Tooltip
			$('#compareschedules').fullCalendar('unselect'); //Unselect current FullCalendar selection
		});
	});

	//Calculate height that Full Calendar should be
	function compareschedules_calcFullCalendarHeight() {
		//20px for padding, 50px for <h2> and <hr>, etc.
		return $(window).height()-$("#navigation").height()-20-$("#compareschedules-meta").height()-(isVisible($("#compareschedules-meta")) ? $("#compareschedules-meta").height()+60 : 0);
	}

});