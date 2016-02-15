//JAVASCRIPT GLOBAL VARIABLES


var mainschedule; //Global mainschedule variable
var tooltip; //Global tooltip variable

//BG Colors
var BGwithWhiteText = ["#60B044", "#DC2127", "#3333FF", "#000000"]; //BG Colors for Schedule Events that require white text in the foreground
var BGColors = ["#FF0000", "#FF9900", "#FFFF00", "#60B044", "#6600FF", "#CC33CC", "#A4BDFC", "#7AE7BF", "#FBD75B", "#FFB878", "#DC2127", "#DBADFF", "#E1E1E1", "#4C77D5", "#3333FF", "#000000"];
//var BGColors = ["#FFBBBB", "#FFBB7D", "#CBC5F5", "#EEBBEE", "#BBDAFF", "#BDF4CB", "#C9DECB", "#FFFFB5", "#F7F7CE", "#4A9586", "#DBDB97", "#DAAF85", "#D1A0A0", "#FFB5B5", "#A6DEEE", "#FE98F1", "#57BCD9", "#DBBFF7", "#E994AB", "#CB59E8", "#60B044"];

var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

var CURRENTUSERID = 0; //Global userID of the current user

$(document).ready(function() {
	//
	//Get current user ID
	//
	CURRENTUSERID = parseInt($("#currentuserid").val());

	//
	//Initialize everything
	//

	//Color Pickers
	init_colorpicker();
	//Tooltips
	init_tooltipster();
})

//For detection of Daylight Savings Time
Date.prototype.stdTimezoneOffset = function() {
	var jan = new Date(this.getFullYear(), 0, 1);
	var jul = new Date(this.getFullYear(), 6, 1);
	return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.dst = function() {
	return this.getTimezoneOffset() < this.stdTimezoneOffset();
}


//JAVASCRIPT OBJECTS

function NonRecurringEventObject(start, end) {
	this.start = start; //Int - UNIX start time
	this.end = end; //Int - UNIX end time
}

function RecurringEventObject() {
	//Object metadata
	this.set = false; //Whether this object has been set

	//Recurs metadata
	this.eventBlockStart = 0; //Int - UNIX start time for this event block (e.g. Sunday 21, 2013 4:00pm)
	this.eventBlockEnd = 0; //Int - UNIX end time for this event block (e.g. Sunday 21, 2013 7:00pm); this block itself is what gets repeated to create the overarching "Event"
	this.allDay = false;

	//Ends
	this.endsNever = true; //Boolean - Recurring event never ends
	this.endsAfter = false; //Boolean - Recurring event ends after x occurrences
	this.endsAfterOccurrences = 0; //Int - Event ends after _ occurrences
	this.endsBy = false; //Boolean - Recurring event ends by some date
	this.endsByTime = 0; //Int UNIX time for the end of the day that this event stops recurring on

	//Daily
	this.day = ""; //String - This event repeats every _ days

	//Weekly
	this.week = ""; //String - This event repeats every _ weeks
	this.dayOfWeek = new Array(); //2-D Array - This event repeats every [0][0], for Sunday, Monday, etc. [0][1] for starttime, UNIX [0][2] for endtime, UNIX

	//Monthly
	this.month = ""; //String - This event repeats every _ months
	this.dayOfMonth = ""; //String - This event repeats every _ days
	this.dayOccurrenceInMonth = 0; //Int - 1-5, for First, Second, Third, Fourth, Last

	//Year
	this.thisMonth = ""; //String - This even occurs yearly on the _ month (0-11, January...December)
	this.year = ""; //String - This event repeats every _ years (can be "*" too, as well as Int)

	this.setEventBlockStart = function(start) {
		this.eventBlockStart = start;
		this.set = true;
	}
	this.setEventBlockEnd = function(end) {
		this.eventBlockEnd = end;
		this.set = true;
	}
	this.setAllDay = function(allday) {
		this.allDay = allday;
	}
	this.setEndsVal = function(endsval) {
		if (endsval=="after") {
			this.endsNever = false;
			this.endsAfter = true;
			this.endsBy = false;
		}
		else if (endsval=="by") {
			this.endsNever = false;
			this.endsAfter = false;
			this.endsBy = true;
		}
		else { //Never ends
			this.endsNever = true;
			this.endsAfter = false;
			this.endsBy = false;
		}
		this.set = true;
	}
	this.setEndsAfterOccurrences = function(occurrences) {
		this.endsAfterOccurrences = occurrences;
		this.set = true;
	}
	this.setEndsByTime = function(time) {
		this.endsByTime = time;
		this.set = true;
	}
	this.setDay = function(day) {
		this.day = day;
		this.set = true;
	}
	this.setWeek = function(week) {
		this.week = week;
		this.set = true;
	}
	this.addDayOfWeek = function(dayofweek, startTime, endTime) {
		for (var i = 0; i<this.dayOfWeek.length; i++) {
			if (this.dayOfWeek[i][0]==dayofweek) {
				//Check if the startTime and endTime is on a "sunday" or "monday" as the user has input into this function
				var updatedStartTime = moment.unix(startTime).add(parseInt(getCookie('timezone_offset')), 'm').day(this.dayOfWeek[i][0]).subtract(parseInt(getCookie('timezone_offset')), 'm').unix(); //Adjust UNIX to fall on the day of the week it is supposed to be on
				var updatedEndTime = moment.unix(endTime).add(parseInt(getCookie('timezone_offset')), 'm').day(this.dayOfWeek[i][0]).subtract(parseInt(getCookie('timezone_offset')), 'm').unix(); //Adjust UNIX to fall on the day of the week it is supposed to be on
				this.dayOfWeek[i][1] = updatedStartTime;
				this.dayOfWeek[i][2] = updatedEndTime;
				this.set = true;
				return;
			}
		}
		//If no element exists already, create one
		var updatedStartTime = moment.unix(startTime).add(parseInt(getCookie('timezone_offset')), 'm').day(dayofweek).subtract(parseInt(getCookie('timezone_offset')), 'm').unix(); //Adjust UNIX to fall on the day of the week it is supposed to be on
		var updatedEndTime = moment.unix(endTime).add(parseInt(getCookie('timezone_offset')), 'm').day(dayofweek).subtract(parseInt(getCookie('timezone_offset')), 'm').unix(); //Adjust UNIX to fall on the day of the week it is supposed to be on
		this.dayOfWeek.push([dayofweek, updatedStartTime, updatedEndTime]);
		this.set = true;
	}
	this.addJSONDaysOfWeek = function(json) { //1+ days of weeks in JSON string
		var daysofweekarray = $.parseJSON(json);
		if (daysofweekarray===undefined||daysofweekarray===null) {
		}
		else {
			for (var i = 0; i<daysofweekarray.length; i++) {
				var dayofweek = daysofweekarray[i][0];
				var startTime = daysofweekarray[i][1];
				var endTime = daysofweekarray[i][2];
				this.addDayOfWeek(dayofweek, startTime, endTime);
			}
		}
		this.set = true;
	}
	this.setMonth = function(month) {
		this.month = month;
		this.set = true;
	}
	this.setDayOfMonth = function(dayofmonth) {
		this.dayOfMonth = dayofmonth;
		this.set = true;
	}
	this.setDayOccurrenceInMonth = function(dayoccurrenceinmonth) {
		this.dayOccurrenceInMonth = dayoccurrenceinmonth;
		this.set = true;
	}
	this.setThisMonth = function(thismonth) {
		this.thisMonth = thismonth;
		this.set = true;
	}
	this.setYear = function(year) {
		this.year = year;
		this.set = true;
	}

	this.isSet = function() {
		return this.set;
	}
	this.getEventBlockStart = function() {
		return this.eventBlockStart;
	}
	this.getEventBlockEnd = function() {
		return this.eventBlockEnd;
	}
	this.getAllDay = function() {
		return this.allDay;
	}
	this.getDay = function() {
		return this.day;
	}
	this.getWeek = function() {
		return this.week;
	}
	this.getDayOfWeek = function() {
		return this.dayOfWeek;
	}
	this.getMonth = function() {
		return this.month;
	}
	this.getDayOccurrenceInMonth = function() {
		return this.dayOccurrenceInMonth;
	}
	this.getDayOfMonth = function() {
		return this.dayOfMonth;
	}
	this.getYear = function() {
		return this.year;
	}
	this.getThisMonth = function() {
		return this.thisMonth;
	}
	this.getEndsVal = function() {
		if (this.endsAfter) {
			return "after";
		}
		else if (this.endsBy) {
			return "by";
		}
		else {
			return null;
		}
	}
	this.getEndsNever = function() {
		return this.endsNever;
	}
	this.getEndsAfter = function() {
		return this.endsAfter;
	}
	this.getEndsAfterOccurrences = function() {
		return this.endsAfterOccurrences;
	}
	this.getEndsBy = function() {
		return this.endsBy;
	}
	this.getEndsByTime = function() {
		return this.endsByTime;
	}
	this.getEndsByTimeDate = function() {
		return moment.unix(this.endsByTime).subtract(parseInt(getCookie('timezone_offset')), 'm').format('M/D/YYYY');
	}
	this.getSummary = function() {
		var invalidinputmessage = "Invalid recurring information entered.";
		
		var repeatsSummaryText = ""; //Return this string representation of the RecursObj
		
		if (this.day!==""&&this.day!=="*") { //Daily
			//Every value
			if (this.day==1) { //Occurs every day
				repeatsSummaryText += "Daily";
			}
			else { //Occurs every x days
				repeatsSummaryText += "Every "+this.day+" days";
			}
		}
		else if (this.week!==""&&this.week!=="*") { //Weekly
			if (this.week==1) { //Occurs every week
				repeatsSummaryText += "Weekly on ";
			}
			else { //Occurs every x weeks
				repeatsSummaryText += "Every "+this.week+" weeks on ";
			}

			//Each day and time
			for (i = 0; i<this.dayOfWeek.length; i++) {
				if (i==0) { //First element in array, no comma before
				}
				else {
					repeatsSummaryText += ", "; //Element in array before this day, put a comma to separate them
				}
				repeatsSummaryText += days[this.dayOfWeek[i][0]]; //Convert 0->Sunday, 1->Monday, etc.
				if (!this.allDay) {
					repeatsSummaryText += " ("+moment.unix(this.dayOfWeek[i][1]).subtract(moment.unix(this.dayOfWeek[i][1]).utcOffset(), 'm').format("h:mma")+"-"+moment.unix(this.dayOfWeek[i][2]).subtract(moment.unix(this.dayOfWeek[i][2]).utcOffset(), 'm').format("h:mma")+")"; //Convert UNIX -> 4:00am, UNIX -> 5:00pm, then those times to "(4:00am-5:00pm)"
				}
			}
		}
		else if (this.month!==""&&this.month!=="*") { //Monthly
			if (this.month==1) { //Occurs every month
				repeatsSummaryText += "Monthly on ";
			}
			else { //Occurs every x months
				repeatsSummaryText += "Every "+this.month+" months on ";
			}

			//Day # of Month
			if (this.dayOfMonth!==""&&this.dayOfMonth!=="*") {
				repeatsSummaryText += "the "+this.dayOfMonth+number_suffix(this.dayOfMonth)+" day";
			}
			//Day Occurrence in Month
			else if (this.dayOccurrenceInMonth!==""&&this.dayOccurrenceInMonth!=="*") {
				var Nth = parseInt(this.dayOccurrenceInMonth)===1 ? "first" : (parseInt(this.dayOccurrenceInMonth)===2 ? "second" : (parseInt(this.dayOccurrenceInMonth)===3 ? "third" : (parseInt(this.dayOccurrenceInMonth)===4 ? "fourth" : (parseInt(this.dayOccurrenceInMonth)===5 ? "last" : "last"))));
				repeatsSummaryText += "the "+Nth+" "+days[this.dayOfWeek[0][0]]; //Convert Day of Week (0,1,2,3,4,5,6) to text, e.g. 0 => Sunday, 1 => Monday, etc.
			}
			else {
				return invalidinputmessage;
			}
		}
		else if (this.year!==""&&this.year!=="*") { //Yearly
			if (this.year==1) { //Occurs every year
				repeatsSummaryText += "Annually on ";
			}
			else { //Occurs every x years
				repeatsSummaryText += "Every "+this.year+" years on ";
			}

			//Day # of Month
			if (this.dayOfMonth!==""&&this.dayOfMonth!=="*") {
				repeatsSummaryText += "the "+this.dayOfMonth+number_suffix(this.dayOfMonth)+" day";
			}
			//Day Occurrence in Month
			else if (this.dayOccurrenceInMonth!==""&&this.dayOccurrenceInMonth!=="*") {
				var Nth = parseInt(this.dayOccurrenceInMonth)===1 ? "first" : (parseInt(this.dayOccurrenceInMonth)===2 ? "second" : (parseInt(this.dayOccurrenceInMonth)===3 ? "third" : (parseInt(this.dayOccurrenceInMonth)===4 ? "fourth" : (parseInt(this.dayOccurrenceInMonth)===5 ? "last" : "last"))));
				repeatsSummaryText += "the "+Nth+" "+days[this.dayOfWeek[0][0]]; //Convert Day of Week (0,1,2,3,4,5,6) to text, e.g. 0 => Sunday, 1 => Monday, etc.
			}
			else {
				return invalidinputmessage;
			}
			
			//This Month
			repeatsSummaryText += " of "+months[this.thisMonth];
		}
		else {
			return invalidinputmessage;
		}

		//Ends value
		if (this.endsNever) { //Ends After _ occurrences
			repeatsSummaryText += "";
		}
		else if (this.endsAfter) {
			repeatsSummaryText += ", stop after "+this.endsAfterOccurrences+" times";
		}
		else if (this.endsBy) {
			repeatsSummaryText += ", until "+moment.unix(this.endsByTime).subtract(moment.unix(this.endsByTime).utcOffset(), 'm').format('M/D/YYYY'); //Convert UNIX -> MM/DD/YYYY
		}
		else {
			return invalidinputmessage;
		}

		return repeatsSummaryText;
	}

	this.reset = function() {
		this.set = false; //This RecursEventObj hasn't been set - it has been reset

		this.eventBlockStart = 0; //Int - UNIX start time for this event block (e.g. Sunday 21, 2013 4:00pm)
		this.eventBlockEnd = 0; //Int - UNIX end time for this event block (e.g. Sunday 21, 2013 7:00pm); this block itself is what gets repeated to create the overarching "Event"
		this.allDay = false;

		this.endsNever = true; //Boolean - Recurring event never ends
		this.endsAfter = false; //Boolean - Recurring event ends after x occurrences
		this.endsAfterOccurrences = 0; //Int - Event ends after _ occurrences
		this.endsBy = false; //Boolean - Recurring event ends by some date
		this.endsByTime = 0; //Int UNIX time for the end of the day that this event stops recurring on

		this.day = "*"; //String - This event repeats every _ days
		this.week = "*"; //String - This event repeats every _ weeks
		this.dayOfWeek = new Array(); //2-D Array - This event repeats every [0][0], for Sunday, Monday, etc. [0][1] for starttime, UNIX [0][2] for endtime, UNIX
		this.month = "*"; //String - This event repeats every _ months
		this.dayOfMonth = "*"; //String - This event repeats every _ days
		this.dayOccurrenceInMonth = "*"; //Int - 1-5, will be placed after # is the 1st, 2nd, 3rd, 4th, last per month ; 
		this.year = "*"; //String - This event repeats every _ years
		this.thisMonth = "*"; //String - This even occurs yearly on the _ month (0-11, January...December)
	}
}


//JAVASCRIPT FUNCTIONS




//AJAX REFRESH PHP FILES
function refresh_ajaxelements() {
	if (arguments.length==0) { //No parameters passed - Refresh all ajax-refresh elements on page
		//Refresh calendar
		if ($("#mainschedule").length>0) {
			$("#mainschedule").fullCalendar('refetchEvents');
		}
		if ($("#scheduleview").length>0) { //scheduleview.php
			$("#scheduleview").fullCalendar('refetchEvents');
		}
		if ($("#compareschedules").length>0) { //compareschedules.php
			$("#compareschedules").fullCalendar('refetchEvents');
		}

		//Special Cases
		//Eventslist scheduleevents - needs to be before eventslist_tagssidebar b/c depends on selected tags to determine which events to display
		var currentpage = 1; //Default to page 1
		if ($("#eventslist-events-scheduleevents .scheduleevent").length>1) { //More than one event matches current query params
			currentpage = parseInt($("#eventslist-events .paginate-btn.current").text()); //Get current page
		}	
		else {
			currentpage = parseInt($("#eventslist-events .paginate-btn.current").text())-1; //Get current page-1 (because after this event is removed, there will be 1 less page)
		}
		load_eventslist_scheduleevents(currentpage); //Go to current page

		//Refresh any element with class ".ajax-refresh"
		$(".ajax-refresh").each(function() {
			var phpfile = $(this).attr('id').replace(/-/g, "/")+".php"; //Name of PHP content file = ID of container div - "content-" + "content/" + ".php"
			var extraURLParams = ""; //Extra GET params in case we need to preserve state of <div> after AJAX refresh

			//Special Cases
			//Content_eventslist_scheduleevents
			if (phpfile=="content/content_eventslist_scheduleevents.php") {
				return true;
			}
			//Content_eventslist_tagssidebar
			if (phpfile=="content/content_eventslist_tagssidebar.php") {
				//Get selected tagids
				var rawtagids =  $("#eventslist-tags-sidebar .eventslist-tags-sidebar-tag:checked").map(function(){
					return $(this).val();
				}).get(); //Returns array of selected values
				var tagids = http_build_query(rawtagids, "tagids");
				//Get selected seriesids
				var rawseriesids =  $("#eventslist-tags-sidebar .eventslist-tags-sidebar-series:checked").map(function(){
					return $(this).val();
				}).get(); //Returns array of selected values
				var seriesids = http_build_query(rawseriesids, "seriesids");
				var displayCheckedEvents = ($("#eventslist-tags-sidebar-limitmainschedule").is(":checked") ? 1 : 0);
				extraURLParams = "?"+tagids+"&"+seriesids+"&displaycheckedevents="+displayCheckedEvents;
			}

			$(this).load(phpfile+extraURLParams, function() {
				//If Friends Dashboard, re-do schedulesnapshot
				if (phpfile=="content/content_friendsdashboard.php") {
					init_schedulesnapshot();
				}
				//If Compare Schedules Dashboard, re-do compareschedulesdashboard select2 tagslist
				if (phpfile=="content/content_compareschedulesdashboard.php") {
					init_compareschedulesdashboard_tagslist();
				}
				//If Compare Schedules Groups Dashboard, re-do peoplegroupsdashboard select2 tagslist
				if (phpfile=="content/content_peoplegroupsdashboard.php") {
					init_peoplegroupsdashboard_tagslist();
				}
				//If View Schedules Dashboard, re-do viewschedulesdashboard select2 dropdown
				if (phpfile=="content/content_viewschedulesdashboard.php") {
					init_viewschedulesdashboard_dropdown();
				}
			});
		});
	}
	else { //Arguments passed - these are specific .php files we want to refresh
		var parameters = Array.prototype.slice.call(arguments);
		var callbackfx = null;
		var isCallBackFx = false;
		if (isFunction(parameters[parameters.length-1])) { //If last paramter is a function, move it out of the parameters array
			callbackfx = parameters[parameters.length-1]; //Store function() in callbackfx variable
			isCallBackFx = true;
		}

		for (var i=0; i<parameters.length; i++) {
			var lastFileRefreshed = (i==parameters.length-1); //Boolean if this is the last File we are going to refresh
			//Refresh calendar
			if (parameters[i]=="mainschedule") { //myscheduleshare.php
				if ($("#mainschedule").length>0) {
					mainschedule.fullCalendar('refetchEvents');
					continue;
				}
			}
			if (parameters[i]=="scheduleview") { //scheduleview.php
				if ($("#scheduleview").length>0) {
					mainscheduleview.fullCalendar('refetchEvents');
					continue;
				}
			}
			if (parameters[i]=="compareschedules") { //compareschedules.php
				if ($("#compareschedules").length>0) {
					compareschedules.fullCalendar('refetchEvents');
					continue;
				}
			}


			//Content_eventslist_scheduleevents
			if (parameters[i]=="eventslist") {
				//First, refresh container to schedule events
				$("#content-content_eventslist_tagssidebar").load("content/content_eventslist_tagssidebar.php");
				var currentpage = 1; //Default to page 1
				if ($("#eventslist-events-scheduleevents .scheduleevent").length>1) { //More than one event matches current query params
					currentpage = parseInt($("#eventslist-events .paginate-btn.current").text()); //Get current page
				}	
				else {
					if (parseInt($("#eventslist-events .paginate-btn.current").text())==1) { //1st page, so don't go back anymore pages
						currentpage = 1;
					}
					else {
						currentpage = parseInt($("#eventslist-events .paginate-btn.current").text())-1; //Get current page-1 (because after this event is removed, there will be 1 less page)
					}
				}
				load_eventslist_scheduleevents(currentpage, function() { //Go to current page
					if (lastFileRefreshed) { //Last file we are refreshing, so call callbackfx
						if (isCallBackFx) { //There is a callbackfx
							callbackfx();
						}
					}
				});
			}

			//Refresh any element with class ".ajax-refresh" and in parameters[] array
			//Format PHP files like this when passed to refresh_ajaxelements(): "content_filename"
			$(".ajax-refresh").each(function() {
				var containerdivid = $(this).attr('id').substring($(this).attr('id').indexOf("-")+1); //ID of container div (everything after "content-" in ID)
				var phpfile = "content/"+containerdivid+".php"; //Name of PHP content file = "content/" + ID of container div + ".php" -> "content/content_friendsdashboard.php"
				var extraURLParams = "";

				if (parameters[i]==containerdivid) {
					fileName = parameters[i]; //Must store paramters[i] in temporary local variable b/c it will ++ by the time the AJAX request finished (b/c it occurs asynchronously)
					
					//Special cases
					//Content_eventslist_tagssidebar
					if (fileName=="content_eventslist_tagssidebar") {
						//Get selected tagids
						var rawtagids =  $("#eventslist-tags-sidebar .eventslist-tags-sidebar-tag:checked").map(function(){
							return $(this).val();
						}).get(); //Returns array of selected values
						var tagids = http_build_query(rawtagids, "tagids");
						//Get selected seriesids
						var rawseriesids =  $("#eventslist-tags-sidebar .eventslist-tags-sidebar-series:checked").map(function(){
							return $(this).val();
						}).get(); //Returns array of selected values
						var seriesids = http_build_query(rawseriesids, "seriesids");
						var displayCheckedEvents = ($("#eventslist-tags-sidebar-limitmainschedule").is(":checked") ? 1 : 0);
						extraURLParams = "?"+tagids+"&"+seriesids+"&displaycheckedevents="+displayCheckedEvents;
					}

					$(this).load(phpfile+extraURLParams, function() {
						//If Friends Dashboard, re-do schedulesnapshot
						if (fileName=="content_friendsdashboard") {
							init_schedulesnapshot();
						}
						//If Compare Schedules Dashboard, re-do compareschedulesdashboard select2 tagslist
						if (fileName=="content_compareschedulesdashboard") {
							init_compareschedulesdashboard_tagslist();
						}
						//If Compare Schedules Groups Dashboard, re-do peoplegroupsdashboard select2 tagslist
						if (fileName=="content_peoplegroupsdashboard") {
							init_peoplegroupsdashboard_tagslist();
						}
						//If View Schedules Dashboard, re-do viewschedulesdashboard select2 dropdown
						if (fileName=="content_viewschedulesdashboard") {
							init_viewschedulesdashboard_dropdown();
						}
						if (lastFileRefreshed) { //Last file we are refreshing, so call callbackfx
							if (isCallBackFx) { //There is a callbackfx
								callbackfx();
							}
						}
					});
				}
			});
		}
	}
	//Always re-do Tooltips
	init_tooltipster();
}

//LOAD EVENTSLIST'S SCHEDULE EVENTS
function load_eventslist_scheduleevents(pagenum, callbackfx) {
	//Get selected tagids
	var rawtagids =  $("#eventslist-tags-sidebar .eventslist-tags-sidebar-tag:checked").map(function(){
		return $(this).val();
	}).get(); //Returns array of selected values
	var tagids = http_build_query(rawtagids, "tagids");
	//Get selected seriesids
	var rawseriesids =  $("#eventslist-tags-sidebar .eventslist-tags-sidebar-series:checked").map(function(){
		return $(this).val();
	}).get(); //Returns array of selected values
	var seriesids = http_build_query(rawseriesids, "seriesids");

	//Get queryval
	var rawqueryval = $("#eventslist-search").val();
	var queryval = encodeURIComponent(rawqueryval);

	$("#content-content_eventslist_scheduleevents").load("content/content_eventslist_scheduleevents.php?page="+pagenum+"&query="+queryval+"&"+tagids+"&"+seriesids, function() {
		//Re-do tooltips
		init_tooltipster();
		//Resize Eventlist's scheduleevent container
		resizeEventslistScheduleeventContainer();
		//Call back function
		if (!isnullorundef(callbackfx)) {
			callbackfx();
		}
	});

}

//LOAD ADDSCHEDULEEVENT'S SCHEDULE EVENTS
function load_addscheduleevents_scheduleevents(callbackfx) {
	//Get queryval
	var rawqueryval = $("#addscheduleevents-search").val();
	var queryval = encodeURIComponent(rawqueryval);

	$("#content-content_addscheduleevents_scheduleevents").load("content/content_addscheduleevents_scheduleevents.php?query="+queryval, function() {
		//Re-do tooltips
		init_tooltipster();
		//Call back fx
		callbackfx();
	});
}

//LOAD ADDEVENTSERIES'S EVENT SERIES
function load_addeventseries_eventseries(callbackfx) {
	//Get queryval
	var rawqueryval = $("#addeventseries-search").val();
	var queryval = encodeURIComponent(rawqueryval);

	$("#content-content_addeventseries_eventseries").load("content/content_addeventseries_eventseries.php?query="+queryval, function() {
		//Re-do tooltips
		init_tooltipster();
		//Call back fx
		callbackfx();
	});
}


////////////////////
// INIT FUNCTIONS //
////////////////////


//COLOR PICKER
function init_colorpicker() {
	$(".colorpicker").spectrum({
		preferredFormat: "hex",
		showInput: true,
		showButtons: true,
		showPaletteOnly: true,
		togglePaletteOnly: true,
		togglePaletteMoreText: 'More',
		togglePaletteLessText: 'Less',
		allowEmpty: false,
		palette: [
			["#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff"],
			["#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d9ead3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc"],
			["#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
			["#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0"],
			["#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79"],
			["#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47"],
			["#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130"]
		]
	});
}

//CSS MEETING SCHEDULEEVENT COLORS
function init_meetingeventscolor() {
	$('.fullcalendar-scheduleevent-meeting').each(function() { //Color every meeting schedule event
		var classes = this.className.split(' ');
		var thisColor = "#60B044"; //Default meeting color
		for (var i = 0; i<classes.length; i++) {
			if (/fullcalendar-scheduleevent-meeting-color-#[A-Fa-f0-9]{6}/.test(classes[i])) {
				thisColor = classes[i].substring(classes[i].indexOf('#')); //Get "#4039AC" part of class name
			}
		}
		var darkenColor = darkenHex(thisColor, .25);
		$(this).css('background', 'repeating-linear-gradient(45deg, '+thisColor+', '+thisColor+' 10px, '+darkenColor+' 10px, '+darkenColor+' 20px)');
	});
}

//TOOLTIPS
function init_tooltipster() {
	$('.tooltip').tooltipster({
	   animation: 'fade',
	   arrow: true,
	   arrowColor: '',
	   content: '',
	   delay: 100,
	   fixedWidth: 0,
	   maxWidth: 200,
	   functionBefore: function(origin, continueTooltip) {
		  continueTooltip();
	   },
	   functionReady: function(origin, tooltip) {
	   },
	   functionAfter: function(origin) {
	   },
	   interactive: true,
	   interactiveTolerance: 3000,
	   offsetX: 0,
	   offsetY: 0,
	   onlyOne: true,
	   position: 'top',
	   speed: 350,
	   timer: 0,
	   theme: '.tooltipster-style',
	   touchDevices: true,
	   trigger: 'custom'
	});
}

//DATEPICKERS AND TIMEPICKERS
function init_datepickers() {
	$(".datepair .datepicker.start").datepicker({
		numberOfMonths: 2,
		showButtonPanel: true,
		onClose: function(selectedDate) {
			$(this).parents(".datepair").find(".datepicker.end").datepicker("option", "minDate", selectedDate);
		}
	});
	$(".datepair .datepicker.end").datepicker({
		numberOfMonths: 2,
		showButtonPanel: true,
		onClose: function(selectedDate) {
			$(this).parents(".datepair").find(".datepicker.start").datepicker("option", "maxDate", selectedDate);
		}
	});

	$(".datepicker.nolimit").datepicker({
		numberOfMonths: 2,
		showButtonPanel: true
	});

	//Initialize Timepickers
	$(".timepicker").timepicker();
}

//SCHEDULE SNAPSHOTS
function init_schedulesnapshot() {
	schedulesnapshot_adjustcurrenttimecursor();
}

function schedulesnapshot_adjustcurrenttimecursor() {
	var secondsInDay = 60*60*24; //Number of seconds in a day
	var startofday = parseInt($("#friendsdashboard-startofdayUNIX").val()); //Start of current day in UNIX seconds
	var currentSecondsSinceStartofDay = (Math.round((new Date()).getTime()/1000)-getCookie("timezone_offset")*60)-startofday; //Current UNIX timestamp - Start of day's UNIX timestamp
	//Move Current Time cursor to appropriate position
	var cursorOffset = currentSecondsSinceStartofDay*100/secondsInDay;
	$(".schedulesnapshot-currenttimecursor").css("left",cursorOffset+"%"); //Left offset of Current Time cursorOffset
}



//
//
//MYSCHEDULESHARE PAGE
//
//

//INVITE OTHERS TOOLTIP - INVITE PEOPLE BY EMAIL TO JOIN MYSCHEDULESHARE
function init_myscheduleshareinviteothers_tagslist() {
	$("#myscheduleshare-inviteothers-tagslist").select2({
		placeholder: "Type a person's name",
		minimumInputLength: 0,
		width: "100%",
		multiple: true,
		tokenSeparators: [",", " "],
		createSearchChoice: function(term) {
			var input = term.trim();
			//Filter input for tagging
			if (input=="") {
				//Ignore blank input
				return null;
			}
			else if (input.indexOf("@")==-1) {
				//Email must have @
				return null;
			}
			//Try to suggest email endings, e.g. gmail.com, comcast.net
			
			return { id: input, text: input };
		},
		query: function (query) {
			var data = { results: [] };
			query.callback(data);
		},
		formatResult: function format(email) {
			return email.text;
		},
		formatSelection: function format(email) {
			return email.text;
		}
	});
}




//
//
//COMPARE SCHEDULES DASHBOARD
//
//

//COMPARE SCHEDULES DASHBOARD PERSON SELECT2 TAGSLIST
function init_compareschedulesdashboard_tagslist() {
	$("#compareschedulesdashboard-tagslist").select2({
		placeholder: "Type a person's name",
		minimumInputLength: 0,
		width: "100%",
		multiple: true,
		ajax: {
			url: "../process/return_allpeople.php",
			type: "POST",
			dataType: 'JSON',
			quietMillis: 50,
			data: function (term, page) {
				return {
					query: term, //Search term
				};
			},
			results: function (data, page) { // parse the results into the format expected by Select2.
					return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function format(person) {
			return select2ResultFormat_person(person);
		},
		formatSelection: function format(person) {
			return select2ResultFormat_person(person);
		}
	});
	//Resize Select2's inner input field
	$("#s2id_compareschedulesdashboard-tagslist .select2-input.select2-default").width($("#compareschedulesdashboard .dropdownarrow-headergroup").width()-10); //Minus 10 to adjust for left and right padding of 5px
}

//
//
//COMPARE SCHEDULES PAGE
//
//

//COMPARE SCHEDULES PERSON SELECT2 TAGSLIST
function init_compareschedules_tagslist() {
	$("#compareschedules-tagslist").select2({
		placeholder: "Type a person's name",
		minimumInputLength: 0,
		width: "100%",
		multiple: true,
		ajax: {
			url: "../process/return_allpeople.php",
			type: "POST",
			dataType: 'JSON',
			quietMillis: 50,
			data: function (term, page) {
				return {
					query: term, //Search term
				};
			},
			results: function (data, page) { // parse the results into the format expected by Select2.
					return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function format(person) {
			return select2ResultFormat_person(person);
		},
		formatSelection: function format(person) {
			return select2ResultFormat_person(person);
		}
	});
}

//
//
//COMPARE SCHEDULES GROUPS DASHBOARD
//
//

//COMPARE SCHEDULES GROUPS DASHBOARD PERSON TAGSLIST
function init_peoplegroupsdashboard_tagslist() {
	$("#peoplegroups-group-create-tagslist").select2({
		placeholder: "Type a person's name",
		minimumInputLength: 0,
		width: "100%",
		multiple: true,
		ajax: {
			url: "../process/return_allpeople.php",
			type: "POST",
			dataType: 'JSON',
			quietMillis: 50,
			data: function (term, page) {
				return {
					query: term, //Search term
				};
			},
			results: function (data, page) { // parse the results into the format expected by Select2.
				return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function format(person) {
			return select2ResultFormat_person(person);
		},
		formatSelection: function format(person) {
			return select2ResultFormat_person(person);
		}
	});
}


//
//
//VIEW SCHEDULES DASHBOARD
//
//

//VIEW SCHEDULES DASHBOARD PERSON SELECT2 DROPDOWN
function init_viewschedulesdashboard_dropdown() {
	$("#viewschedulesdashboard-personsearch").select2({
		placeholder: "Type a person's name",
		minimumInputLength: 0,
		width: "100%",
		ajax: { // instead of writing the function to execute the request we use Select2's convenient helper
			url: "../process/return_allpeople.php",
			type: "POST",
			dataType: 'json',
			data: function (term, page) {
				return {
					query: term, // search term
				};
			},
			results: function (data, page) { // parse the results into the format expected by Select2.
				return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function format(person) {
			return select2ResultFormat_person(person);
		},
		formatSelection: function format(person) {
			return select2ResultFormat_person(person);
		}
	});
}


///
///
///
//// FULL CALENDAR ////
///
///
///

//CREATE EVENT TOOLTIP - INVITE PEOPLE TO EVENT SELECT2 TAGSLIST
function init_fullcalendarcreateeventinvitedlist_tagslist(personObjs) {
	$("#createevent-tooltip-invitedlist").select2({
		placeholder: "None",
		width: "100%",
		multiple: true,
		ajax: {
			url: "../process/return_allpeople.php",
			type: "POST",
			dataType: 'JSON',
			quietMillis: 50,
			data: function (term, page) {
				return {
					query: term, //Search term
					excludeSelf: "true" //Don't return current user
				};
			},
			results: function (data, page) { // parse the results into the format expected by Select2.
					return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function format(person) {
			return select2ResultFormat_person(person);
		},
		formatSelection: function format(person) {
			return select2ResultFormat_person(person);
		}
	});

	//Initial value - Array of Person Objects to become the Tags
	if (!isnullorundef(personObjs)) {
		$("#createevent-tooltip-invitedlist").select2("data", personObjs);
	}
}


///
///
///
//// EDIT EVENT ////
///
///
///

//EDIT EVENT - INVITED PEOPLE SELECT2 TAGSLIST
function init_editeventinvited_tagslist(personObjs) {
	$("#editevent-invited-tagslist").select2({
		placeholder: "None", //Default is no one is invited
		minimumInputLength: 0,
		width: "100%",
		multiple: true,
		ajax: {
			url: "../process/return_allpeople.php",
			type: "POST",
			dataType: 'JSON',
			quietMillis: 50,
			data: function (term, page) {
				return {
					query: term, //Search term
					excludeSelf: "true"
				};
			},
			results: function (data, page) { // parse the results into the format expected by Select2.
					return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function format(person) {
			return select2ResultFormat_person(person);
		},
		formatSelection: function format(person) {
			return select2ResultFormat_person(person);
		}
	});

	//Initial value - Array of Person Objects to become the Tags
	if (!isnullorundef(personObjs)) {
		$("#editevent-invited-tagslist").select2("data", personObjs);
	}
}

//EDIT EVENT - EVENT SERIES TAGSLIST
function init_editeventeventseries_tagslist(eventseriesObjs) {
	$("#editevent-eventseries-tagslist").select2({
		placeholder: "Type an event series' name",
		minimumInputLength: 1,
		width: "100%",
		multiple: true,
		ajax: {
			url: "../process/return_alleventseries.php",
			type: "POST",
			dataType: 'JSON',
			quietMillis: 50,
			data: function (term, page) {
				return {
					query: term, //Search term
				};
			},
			results: function (data, page) { // parse the results into the format expected by Select2.
					return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function format(eventseries) {
			return select2ResultFormat_eventseries(eventseries);
		},
		formatSelection: function format(eventseries) {
			return select2ResultFormat_eventseries(eventseries);
		}
	});

	//Initial value - Array of Schedule Event Objects to become the Tags
	if (!isnullorundef(eventseriesObjs)) {
		$("#editevent-eventseries-tagslist").select2("data", eventseriesObjs);
	}
}


//EDIT EVENT - TEACHER SELECT2 DROPDOWN
function init_editeventteacher_dropdown(personObj) {
	$("#editevent-teacher").select2({
		placeholder: "Type a person's name",
		minimumInputLength: 0,
		width: "300px",
		ajax: { // instead of writing the function to execute the request we use Select2's convenient helper
			url: "../process/return_allpeople.php",
			type: "POST",
			dataType: 'json',
			data: function(term, page) {
				return {
					query: term, // search term
				};
			},
			results: function(data, page) { // parse the results into the format expected by Select2.
				return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function(person) {
			return select2ResultFormat_person(person);
		},
		formatSelection: function(person) {
			return select2ResultFormat_person(person);
		},
	});

	//Initial value - Person Object to become selected value
	if (!isnullorundef(personObj)&&personObj.id!=0) {
		$("#editevent-teacher").select2("data", personObj);
	}
}

///
///
///
//// EDIT EVENT SERIES ////
///
///
///



//EDIT EVENT SERIES - TEACHER SELECT2 DROPDOWN
function init_editeventseriesteacher_dropdown(personObj) {
	$("#editeventseries-teacher").select2({
		placeholder: "Type a person's name",
		minimumInputLength: 0,
		width: "300px",
		ajax: { // instead of writing the function to execute the request we use Select2's convenient helper
			url: "../process/return_allpeople.php",
			type: "POST",
			dataType: 'json',
			data: function(term, page) {
				return {
					query: term, // search term
				};
			},
			results: function(data, page) { // parse the results into the format expected by Select2.
				return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function(person) {
			return select2ResultFormat_person(person);
		},
		formatSelection: function(person) {
			return select2ResultFormat_person(person);
		},
	});

	//Initial value - Person Object to become selected value
	if (!isnullorundef(personObj)&&!isnullorundef(personObj.id)) {
		$("#editeventseries-teacher").select2("data", personObj);
	}
}

//EDIT EVENT SERIES - EVENTS TAGSLIST
function init_editeventseriesscheduleevents_tagslist(eventObjs) {
	$("#editeventseries-scheduleevents-tagslist").select2({
		placeholder: "Type an event's name",
		minimumInputLength: 0,
		width: "100%",
		multiple: true,
		ajax: {
			url: "../process/return_eventseries_eventstoadd.php",
			type: "POST",
			dataType: 'JSON',
			quietMillis: 50,
			data: function (term, page) {
				return {
					seriesid: $("#editeventseries-seriesid").val(), //Series ID
					query: term, //Search term
				};
			},
			results: function (data, page) { // parse the results into the format expected by Select2.
					return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function format(event) {
			return select2ResultFormat_scheduleevent(event);
		},
		formatSelection: function format(event) {
			return select2ResultFormat_scheduleevent(event);
		}
	});

	//Initial value - Array of Schedule Event Objects to become the Tags
	if (!isnullorundef(eventObjs)) {
		$("#editeventseries-scheduleevents-tagslist").select2("data", eventObjs);
	}
}


//EDIT EVENT SERIES - INVITED PEOPLE SELECT2 TAGSLIST
function init_editeventseriesinvited_tagslist(personObjs) {
	$("#editeventseries-invited-tagslist").select2({
		placeholder: "None", //Default is no one is invited
		minimumInputLength: 0,
		width: "100%",
		multiple: true,
		ajax: {
			url: "../process/return_allpeople.php",
			type: "POST",
			dataType: 'JSON',
			quietMillis: 50,
			data: function (term, page) {
				return {
					query: term, //Search term
					excludeSelf: "true"
				};
			},
			results: function (data, page) { // parse the results into the format expected by Select2.
					return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function format(person) {
			return select2ResultFormat_person(person);
		},
		formatSelection: function format(person) {
			return select2ResultFormat_person(person);
		}
	});

	//Initial value - Array of Person Objects to become the Tags
	if (!isnullorundef(personObjs)) {
		$("#editeventseries-invited-tagslist").select2("data", personObjs);
	}
}


///
///
///
//// EDIT EVENT TAG ////
///
///
///

//EDIT EVENT TAG - EVENTS TAGSLIST
function init_editeventtagscheduleevents_tagslist(eventObjs) {
	$("#editeventtag-scheduleevents-tagslist").select2({
		placeholder: "Type an event's name",
		minimumInputLength: 1,
		width: "100%",
		multiple: true,
		ajax: {
			url: "../process/return_allevents.php",
			type: "POST",
			dataType: 'JSON',
			quietMillis: 50,
			data: function (term, page) {
				return {
					query: term, //Search term
				};
			},
			results: function (data, page) { // parse the results into the format expected by Select2.
					return { results: data, text: 'name' };
			},
			sortResults: function(results, container, query) { //Sort results alphabetically
				if (query.term) {
					// use the built in javascript sort function
					return results.sort(function(a, b) {
						var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
						if (nameA < nameB) { //sort string ascending
							return -1;
						}
						else if (nameA > nameB) {
							return 1;
						}
						else {
							return 0; //default return value (no sorting)
						}
					});
				}
				return results;
			},
		},
		formatResult: function format(event) {
			return select2ResultFormat_scheduleevent(event);
		},
		formatSelection: function format(event) {
			return select2ResultFormat_scheduleevent(event);
		}
	});

	//Initial value - Array of Schedule Event Objects to become the Tags
	if (!isnullorundef(eventObjs)) {
		$("#editeventtag-scheduleevents-tagslist").select2("data", eventObjs);
	}
}



//SELECT2 FORMATTING OF OBJECTS => RESULT & SELECTION 


function select2ResultFormat_scheduleevent(event) {
	return preventxss(event.name+" - "+event.occursinfo);
}
function select2ResultFormat_eventseries(series) {
	return preventxss(series.name+" - Created by: "+series.createdby.name);
}
function select2ResultFormat_person(person) {
	var extrainfo = "";
	if (person.tom==0) { //Student
		extrainfo = " ("+person.grade+number_suffix(person.grade)+" grade)";
	}
	else if (person.tom==1) { //Teacher
		extrainfo = " (Teacher)";
	}
	else if (person.tom==2) { //Administrator
		extrainfo = " (Administrator)";
	}
	return preventxss(person.name+extrainfo);
}






//SIDE SCROLL EFFECT
function sidescrolleffect(elementidentifier, topoffset) {
	var name = elementidentifier;
	var menuloc = topoffset; //Top offset of compareschedules_colorkey div
	var scrollerchecker=1;
	var offset = menuloc+"px";
	
	$(name).css('max-height',$(window).height()-10); //Set max height to be less than height of window
	
	$(window).scroll(function () { 
		var heightofdiv = $(name).height();
		if ($(window).scrollTop()>menuloc) { //Distance from top for floating div 
			var newoffset=20+$(window).scrollTop()+"px";
			$(name).animate({top:newoffset},{duration:500,queue:false});
		}
		else {
			$(name).animate({top:offset},{duration:500,queue:false});
		}
	});
	
	$(window).resize(function() {
		$(name).css('max-height',$(window).height()-10);
	});
}


//MODAL FOCUS FUNCTIONS
function modalfocus(element, addtooltipster, tooltipstercontent) {
	$("#modal-background").show(); //Enable grey out div
	$(element).addClass("modal-focus");

	if (addtooltipster) {
		//Tooltipster content
		$(element).attr("title", tooltipstercontent); //Set tooltip text
		//Add and show tooltipster
		$(element).tooltipster();
		$(element).tooltipster("show");
	}
	
	//When any part of document.body is clicked besides the modalfocussed element, remove the grey out
	$(document.body).on("click","#modal-background", function() {
		endmodalfocus(element, addtooltipster); //If there is a tooltipster being added, default to remove it on endmodalfocus()
	});
}
function endmodalfocus(element, removetooltipster) {
	$("#modal-background").hide(); //Hide modal background
	$(element).removeClass("modal-focus"); //Remove modal-focus class on modalfocussed element
	if (removetooltipster) { //If there is a tooltipster to remove
		$(element).tooltipster("destroy");
		$(element).attr("title",""); //Erase title
	}
	if (element=="#mainschedule"&&schedulemeeting) { //If mainschedule is modalfocussed and user is curently exiting from scheduling a meeting
		schedulemeeting = false; //Set schedulemeeting state to false
	}
}

//NOTIFY FUNCTIONS
function notify(message, type) {
	$("#notification").hide();
	$("#notification").attr('class', '').addClass("alert").addClass("alert-"+type).slideDown();
	$("#notification").html('<div class="closedialogx">X</div>'+message);
}
$(document.body).click(function() {
	$("#notification").fadeOut(1200);
});

//LOADING ICON FUNCTIONS
function print_loadingicon(element) {
	if (isnullorundef(element)) {
		element = "#mainloadingicon";
		$(element).attr('class', '').addClass("alert").addClass("alert-plain");
	}
	if ($(element+" .loadingicon").length>0) { //Already a loading icon in element
	}
	else {
		var opts = {
			lines: 14, // The number of lines to draw
			length: 7, // The length of each line
			width: 2, // The line thickness
			radius: 2, // The radius of the inner circle
			corners: 1, // Corner roundness (0..1)
			rotate: 0, // The rotation offset
			color: '#000000', // #rgb or #rrggbb
			speed: 1, // Rounds per second
			trail: 40, // Afterglow percentage
			shadow: false, // Whether to render a shadow
			hwaccel: false, // Whether to use hardware acceleration
			className: 'loadingicon', // The CSS class to assign to the spinner
			zIndex: 2147483646, // The z-index (defaults to 2147483646, which is z-index of #mainloadingicon-container)
			top: 'auto', // Top position relative to parent in px
			left: 'auto' // Left position relative to parent in px
		};
		$(element).html(new Spinner(opts).spin().el).show();
	}
}
function end_loadingicon(element) {
	if (isnullorundef(element)) {
		element = "#mainloadingicon";
	}
	$(element+" .loadingicon").remove();
	$(element).hide();
}


//BUTTON LOADING DISABLE FUNCTIONS = ACCEPTS ARRAY OF ELEMENTS AND BOOLEAN IF LOADING ICON SHOULD BE SHOWN
function startDisable(startLoadingIcon, elements) {
	if (startLoadingIcon) { print_loadingicon(); }
	for (var i = 0; i<elements.length; i++) {
		$(elements[i]).prop("disabled", true).addClass("disabled");
	}
}
function endDisable(endLoadingIcon, elements) {
	if (endLoadingIcon) { end_loadingicon(); }
	for (var i = 0; i<elements.length; i++) {
		$(elements[i]).prop("disabled", false).removeClass("disabled");
	}
}

//FULLCALENDAR

function addCustomButtons(calName, datepicker, fullscreenmode) {
	//calName is string of ID of calendar, e.g. mainscheduleview
	//Datepicker and fullscreenmode are boolean values - True if that button will be displayed

	var fullscreenButtonID = calName+'-fullcalendar-fullscreenmode';
	var fullscreenButtonIconID = calName+'-fullcalendar-fullscreenmode-icon';
	var datepickerButtonID = calName+'-fullcalendar-calendar';
	var datepickerID = calName+'-fullcalendar-calendar-datepicker';
	var datepickerButtonIconID = calName+'-fullcalendar-calendar-icon';

	var currentlyInFullscreenMode = $('#'+calName).hasClass("fullscreenmode");

	var datepickerButton = '<button id="'+datepickerButtonID+'" class="fc-button fc-state-default fc-corner-left fc-corner-right fullcalendar-custom-button tooltip tooltip-hover" type="button" title="Jump to...">'+
								'<input type="hidden" id="'+datepickerID+'" value="">' +
								'<img id="'+datepickerButtonIconID+'" src="images/calendar.png" class="small-icon">'+
							'</button>';
	var fullscreenButton = '<button id="'+fullscreenButtonID+'" class="fc-button fc-state-default fc-corner-left fc-corner-right fullcalendar-custom-button tooltip tooltip-hover" type="button" title="Full screen mode">'+
								'<img id="'+fullscreenButtonIconID+'" src="images/'+(currentlyInFullscreenMode ? 'shrink' : 'enlarge' )+'.png" class="small-icon">'+
							'</button>';

	var customButtons = "";

	if (datepicker) {
		customButtons += datepickerButton;
	}
	if (fullscreenmode) {
		customButtons += fullscreenButton;
	}

	//Add to Full Calendar
	//--First, remove any old custom buttons
	$('.fc-toolbar .fc-right .fullcalendar-custom-button').remove();
	$('.fc-toolbar .fc-right').prepend(customButtons);

	//Add functionality to buttons
	if (datepicker) {
		$('#'+datepickerID).datepicker({
			dateFormat: 'dd-mm-yy',
			changeMonth: true,
			changeYear: true,
			showButtonPanel: true,
			onSelect: function(dateText, inst) {
				var d = $(this).datepicker("getDate");
				$('#'+calName).fullCalendar('gotoDate', d);
			}
		});

		$(document.body).on('click', '#'+datepickerButtonID, function() {
			$('#'+datepickerID).datepicker('show');
		});
		
	}
	if (fullscreenmode) {
		$(document.body).off('click', '#'+fullscreenButtonID).on('click', '#'+fullscreenButtonID, function(e) {

			toggleFullScreen();

			//Toggle Full Calendar FullScreenMode button to be either shrink or enlarge
			if ($('#'+calName).hasClass("fullscreenmode")) { //Currently in Full Screen Mode - After this function, user will NOT be in full screen mode anymore
				$('#'+calName).removeClass("fullscreenmode");
				$('#'+fullscreenButtonIconID).attr('src', 'images/enlarge.png');
				$('#'+fullscreenButtonID).attr('title', 'Full Screen Mode').tooltipster(); //Re-do tooltipster to get updated title
			}
			else { //Currently in Regular Mode
				$('#'+calName).addClass("fullscreenmode");
				$('#'+fullscreenButtonIconID).attr('src', 'images/shrink.png');
				$('#'+fullscreenButtonID).attr('title', 'Exit Full Screen Mode').tooltipster(); //Re-do tooltipster to get updated title
				//Hide all Leftpane and Rightpane contentdashboards with dropdown arrows
				$("#leftpane, #rightpane .contentdashboard:not(.minified) .dropdownarrow-headergroup .dropdownarrow").trigger('click'); //Hide all content dashboards that aren't already minified
			}

			//Rerender newly resized Full Calendar
			//Re-draw current time line to fit to bigger calendar
			setCurrentTimeLine($('#'+calName).fullCalendar('getView'));

			//Hide tooltip hovered over "Full Screen Mode" button
			$('#'+fullscreenButtonID).tooltipster('hide');
		});
	}
}

function setCurrentTimeLine(calView) {
	//Add timeline to Week View, if Today is visible
	if (calView.name=='agendaWeek') { //week view, don't want the timeline to go the whole way across
		var dayCol = $(".fc-today:visible");
		//Is Today visible?
		if (!isnullorundef(dayCol)&&dayCol.length>0) { //Today column is visible, add current timeline to visible today column
			var parentDiv = $('.fc-slats:visible').parent();
			var timeline = parentDiv.children(".fullcalendar-currenttimeline");
			if (timeline.length == 0) { //if timeline isn't there, add it
				timeline = $("<div class='fullcalendar-currenttimeline'><div class='fullcalendar-currenttimelinearrow'></div></div>");
				parentDiv.prepend(timeline);
			}

			var curTime = moment();

			if (calView.intervalStart.isBefore(curTime)&&calView.intervalEnd.isAfter(curTime)) {
				timeline.show();
			} else {
				timeline.hide();
				return;
			}

			var calMinTimeInMinutes = strTimeToMinutes(calView.opt("minTime"));
			var calMaxTimeInMinutes = strTimeToMinutes(calView.opt("maxTime"));
			var curSeconds = ((((curTime.hours()*60) + curTime.minutes())-calMinTimeInMinutes)*60) + curTime.seconds();
			var percentOfDay = curSeconds / ((calMaxTimeInMinutes - calMinTimeInMinutes) * 60);

			var topLoc = Math.floor(parentDiv.height() * percentOfDay);
			var timeCol = $('.fc-time:visible');
			timeline.css({top: topLoc + "px", left: (timeCol.outerWidth(true))+"px"});

			var left = dayCol.position().left + 1;
			var width = dayCol.width() + 1;
			timeline.css({left: left + "px", width: width + "px"});
		}
	}
}

//Cast String to Integer or 0 if not Integer
//Redfine parseInt() to behave like PHP (int) => e.g. return 0 instead of NaN
function castInt(n) {
	var result = parseInt(n);
	if (isNaN(result)) {
		return 0;
	}
	else {
		return result;
	}
}

//SCHEDULE FUNCTIONS
	
function generateUNIXFromDatepickerTimepicker(date, time, ad, specificDayOfThisWeek) {
	if (isnullorundef(date)||isnullorundef(time)) {
		//If invalid date/time sent
		return 0;
	}

	// mm/dd/yyyy,h:mm(am or pm)
	var ds = date.split("/");
	var ts = new Array("0","00am");
	ad = (ad=="false"||!ad ? false : true); //Change String to boolean (e.g. "false" -> false, "true" -> true, false -> false, true -> true, 0 -> false, 1 -> true)
	if (!isnullorundef(time)) {
		ts = time.split(":");
	}
	//ts[0] = hours, ts[1] = "04am"
	//If pm, add 12 to hours (unless it's 12 pm)
	if (ts[1].substring(2)=='pm'&&ts[0]!="12") { //Get 'am' or 'pm'
		ts[0]=parseInt(ts[0])+12;
	}
	//If 12:__ am, make it 0:__
	if (ts[0]=='12'&&ts[1].substring(2)=='am') {
		ts = new Array("0",ts[1]);
	}
	if (ad) { //If event is all day
		ts = new Array("0","00am");
	}
	//Create a date Object, convert it to Moment Object, convert that to UTC (add timezone offset to real time, change timezone offset to +0:00), lastly add that timezone offset from real time, to get regular time and +0:00 timezone
	// e.g. Date(4, 3, 12) -> Moment(4, 3, 12) = 4/3/12 4:30+6:00 -> 4/3/12 10:30+0:00 -> 4/3/12 
	//new Date(year, month, day, hours, minutes, seconds, milliseconds)
	var origjsdate = new Date(ds[2], parseInt(ds[0])-1, ds[1], ts[0], ts[1].substring(0,2));
	var datetoconvert = moment(origjsdate).add(moment(origjsdate).utcOffset(), 'm');

	var adjustDayOfWeek = 0;
	if (specificDayOfThisWeek=="sunday") {
		adjustDayOfWeek = parseInt(datetoconvert.unix()-(datetoconvert.day()-0)*60*60*24);
	}
	else if (specificDayOfThisWeek=="monday") {
		adjustDayOfWeek = parseInt(datetoconvert.unix()-(datetoconvert.day()-1)*60*60*24);
	}
	else if (specificDayOfThisWeek=="tuesday") {
		adjustDayOfWeek = parseInt(datetoconvert.unix()-(datetoconvert.day()-2)*60*60*24);
	}
	else if (specificDayOfThisWeek=="wednesday") {
		adjustDayOfWeek = parseInt(datetoconvert.unix()-(datetoconvert.day()-3)*60*60*24);
	}
	else if (specificDayOfThisWeek=="thursday") {
		adjustDayOfWeek = parseInt(datetoconvert.unix()-(datetoconvert.day()-4)*60*60*24);
	}
	else if (specificDayOfThisWeek=="friday") {
		adjustDayOfWeek = parseInt(datetoconvert.unix()-(datetoconvert.day()-5)*60*60*24);
	}
	else if (specificDayOfThisWeek=="saturday") {
		adjustDayOfWeek = parseInt(datetoconvert.unix()-(datetoconvert.day()-6)*60*60*24);
	}
	else { //No specificed day of this week - assume function's parameters are exactly how this date should be interpreted
		adjustDayOfWeek = parseInt(datetoconvert.unix());
	}
	return adjustDayOfWeek;//UNIX timestamp for date
}


function getTodayDate() {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();

	if(dd<10) {
		dd='0'+dd;
	}
	if (mm<10) {
		mm='0'+mm;
	} 
	return mm+'/'+dd+'/'+yyyy;
}

function humanReadableDateRange(startDate, endDate, allDay) {
	//startDate and endDate are MomentJS objects
	allDay = (allDay==="true"||allDay===true||allDay===1); //If string "true" was passed or Boolean true or Integer 1, make it true; otherwise, this function will evaluate to false
	//If All Day, realize that last end date is exclusive (e.g. Moment JS will represent July 7th as 12:00am July 7 - 12:00am July 8, b/c the last 12:00am second is exclusive); However, twix uses inclusive minutes, so the 12:00am July 8 is interpreted as a whole nothing day - So subtract one second to get it to be 12:00am July 7 - 11:59:59 July 7 to be all day in Twix formatting
	if (allDay) { endDate.subtract(1, 'seconds'); }
	var dateRange = startDate.twix(endDate, allDay); //Range of MomentJS objects
	var humanreadable = dateRange.format({implicitMinutes: false, groupMeridiems: false, spaceBeforeMeridiem: false}); //Human readable Date Range
	return humanreadable;
}

//RGB->HEX
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

//HEX->RGB
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

//DETERMINE WHETHER TO USE BLACK OR WHITE TEXT WHEN GIVEN BACKGROUND COLOR
//http://www.w3.org/TR/AERT#color-contrast
function calcTextColor(hex) {
	var rgb = hexToRgb(hex);
	var r = rgb.r;
	var g = rgb.g;
	var b = rgb.b;

    var o = Math.round(((parseInt(r) * 299) + (parseInt(g) * 587) + (parseInt(b) * 114)) /1000);

    return (o > 125) ? '#000000' : '#FFFFFF';               
}

//CALCULTE DARKER/LIGHTER VERSION OF HEX COLOR
function darkenHex(hex, lum) {
	//lum: -0.1 = 10% darker, 0.2 = 20% lighter
	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	}
	lum = lum || 0;

	// convert to decimal and change luminosity
	var rgb = "#", c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i*2,2), 16);
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
		rgb += ("00"+c).substr(c.length);
	}
	return rgb;
}

//ADD DARKENING SHADE TO HEX COLOR
function shadeHex(color, percent) {
	if (isnullorundef(color)) {
		color = "#60B044";
	}
	if (isnullorundef(percent)) {
		percent = 0.85;
	}
	var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
	return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}


//Convert string "5:40" to minutes
function strTimeToMinutes(str_time) {
	var arr_time = str_time.split(":");
	var hour = parseInt(arr_time[0]);
	var minutes = parseInt(arr_time[1]);
	return((hour * 60) + minutes);
}

//FORMATE DATE + SUFFIX
function formatdate(momentobj) {
	var dateno = momentobj.date();
	return dateno+number_suffix(dateno);
}

//FORMAT HOUR FROM MILITARY TIME-> 12-HOUR TIME
function formathour(momentobj) {
	var minutes = momentobj.minutes();
	var twentyfourhr = momentobj.hours(); //Don't change this - for am/pm
	var hours = momentobj.hours();
	if (hours > 12) {
		hours -= 12;
	}
	else if (hours === 0) {
	   hours = 12;
	}
	return hours+':'+twodigitminutes(minutes)+amorpm(twentyfourhr);
}

//AM OR PM FOR MILITARY TIME
function amorpm(hour) {
	if (hour<13) {
		return "am";
	}
	else {
		return "pm";
	}
}

//NUMBER SUFFIX FOR DATES
function number_suffix(i) {
	var j = i % 10;
	if (j == 1 && i != 11) {
		return "st";
	}
	if (j == 2 && i != 12) {
		return "nd";
	}
	if (j == 3 && i != 13) {
		return "rd";
	}
	return "th";
}

//CONVERT 0-59 INTO TWO DIGIT REPRESENTATIONS (E.G. 00, 01, 02, 03-59)
function twodigitminutes(minutes) {
	return (minutes<10 ? '0' : '')+minutes;
}

//CHANGE UNIX TIME -> UTC DATE OBJECT
function adjustunixtime(unixtime) {
	return new Date((unixtime+getCookie("timezone_offset")*60)*1000)
}

//CHECK IF TWO SCHEDULE EVENTS OVERLAP (BASED ON THEIR STARTTIME AND ENDTIMES)
function overlap(s1, e1, s2, e2) {
	s1 = parseInt(s1);
	e1 = parseInt(e1);
	s2 = parseInt(s2);
	e2 = parseInt(e2);
	return ((s1<e2)&&(e1>s2)); //(StartDate1 < EndDate2) and (EndDate1 > StartDate2) http://stackoverflow.com/a/325939
}

//CHECK IF VARIABLE IS UNDEFINED
function isundefined(input) {
	return (typeof input==='undefined');
}

//CHECK IF VARIABLE IS NULL
function isnull(input) {
	return input===null;
}

//CHECK IF VARIABLE IS NULL OR UNDEFINED
function isnullorundef(input) {
	return (isundefined(input)||isnull(input));
}

//CHECK IF VARIABLE IS A FUNCTION
function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

//CHECK IF ELEMENT IS VISIBLE
function isVisible($element) {
	return $element.css('display')!=='none';
}


//FULLSCREEN MODE

function toggleFullScreen() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

//PREVENT XSS OUTPUT

function preventxss(string) {
	if (isnullorundef(string)) {
		return "";
	}
	else {
		var lt = /</g, 
			gt = />/g, 
			ap = /'/g, 
			ic = /"/g;
		return string.toString().replace(lt, "&lt;").replace(gt, "&gt;").replace(ap, "&#39;").replace(ic, "&#34;");
	}
}

//SUBMIT POST DATA AS IF THE DATA WERE IN A FORM (COMPLETE REDIRECT), NOT AN AJAX REQUEST
function formPOST(path, params, method) {
	method = method || "POST"; // Set method to post by default if not specified.

	// The rest of this code assumes you are not using a library.
	// It can be made less wordy if you use one.
	var form = document.createElement("form");
	form.setAttribute("method", method);
	form.setAttribute("action", path);

	for(var key in params) {
		if(params.hasOwnProperty(key)) {
			var hiddenField = document.createElement("input");
			hiddenField.setAttribute("type", "hidden");
			hiddenField.setAttribute("name", key);
			hiddenField.setAttribute("value", params[key]);

			form.appendChild(hiddenField);
		 }
	}

	document.body.appendChild(form);
	form.submit();
}


//COOKIE FUNCTIONS
function getCookie(c_name) {
	var c_value = document.cookie;
	var c_start = c_value.indexOf(";" + c_name + "=");
	if (c_start == -1) {
		c_start = c_value.indexOf(c_name + "=");
	}
	if (c_start == -1) {
	  c_value = null;
	}
	else {
		c_start = c_value.indexOf("=", c_start) + 1;
		var c_end = c_value.indexOf(";", c_start);
		if (c_end == -1) {
			c_end = c_value.length;
		}
		c_value = unescape(c_value.substring(c_start,c_end));
	}
	return c_value;
}
function setCookie(c_name,value,exdays) {
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value+";";
}
function deleteCookie(name) {
	document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}


//BUILD HTTP QUERY WITH GET VARIABLES BASED ON INPUT ARRAY
function http_build_query(arraydata, prefix) {
	var urlquery = "";
	for (var i = 0; i<arraydata.length; i++) { //Loop through every array element, and add to URLquery values
		urlquery += prefix+"["+i+"]"+"="+arraydata[i];
		if (i<arraydata.length-1) {
			urlquery += "&";
		}
	}
	return urlquery;
}


//DISPLAY CSS FUNCTIONS

function resizeEventslistScheduleeventContainer() {
	var tagssidebar = $("#eventslist-tags-sidebar").height();
	if (tagssidebar>500) { //If tags sidebar>500px height
		$("#eventslist-events-scheduleevents").height(tagssidebar).css("max-height",tagssidebar); //Resize Eventslist's scheduleevents container to that size
	}
}

/////////////////////////////
//ADD, CREATE, DELETE FUNCTIONS
/////////////////////////////


function defaultAJAXresultcheck(param) { //Default, normal responses to AJAX results
	if (param.result=="dbfailure") { //Server/PHP error
		notify("Sorry, there was a database error - Please try again at a later time.", "error");
		return true;
	}
	else if (param.result=="invalidinput") {
		notify("Invalid input!","error");
		return true;
	}
	else if (param.result=="redirect") { //Server/PHP error
		window.location.replace(param.redirect);
		return true;
	}
	return false;
}



//// SCHEDULE EVENTS ////

//Create or edit an event
function editevent(eid, ename, estart, eend, eallday, erecur, emeeting, einvited, eteacher, ecolor, evisibility, enewtag, etag, ehw, edescrip, eeventseries, ecreateevent, ertms, eedit, callbackfx) {
	if (ename=="") { //If tagname is empty
		callbackfx({ result: "failed" }, "true");
		notify("You must enter a name for this event.", "error");
		return;
	}
	if (!(typeof estart==='number'&&(estart%1)===0)) { //estart isn't an Integer, must be an Object (Recurring Event Object)
		estart = JSON.stringify(estart); //JSON encode Recurs Event Obj (if exists); if this event isn't recurring, a simple Integer UNIX timestamp will be passed, and JSON.stringify won't modify it
	}
	$.ajax({
		type: "POST",
		url: "../process/process_editevent.php",
		data: {
			id: eid,
			name: ename,
			start: estart, 
			end: eend,
			allday: eallday,
			recur: erecur,
			invited: einvited,
			teacher: eteacher,
			color: ecolor,
			visibility: evisibility,
			newtag: enewtag,
			tag: etag,
			hw: ehw,
			descrip: edescrip,
			eventseries: eeventseries, 
			createevent: ecreateevent,
			rtms: ertms,
			edit: eedit
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

function deleteevent(eventid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_deleteevent.php",
		data: { 
			id: eventid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

function addeventtoschedule(eventid, ertms, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_addeventtoschedule.php",
		data: { 
			eventid: eventid,
			rtms: ertms
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

function removeeventfromschedule(eventid, ertms, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_removeeventfromschedule.php",
		data: { 
			id: eventid,
			rtms: ertms
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

//ACCEPT/DECLINE INVITES

function accepteventinvitation(eventid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_addeventtoschedule.php",
		data: { 
			eventid: eventid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

function declineeventinvitation(eventid, permanentDecline, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_declineeventinvitation.php",
		data: { 
			eventid: eventid,
			permanentDecline: permanentDecline
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}


//// EVENT SERIES ////

//Create or edit an event series
function editeventseries(eseriesid, ename, einvited, eteacher, ecolor, evisibility, enewtag, etag, ehw, edescrip, eevents, ecreateeventseries, ertms, eedit, callbackfx) {
	if (ename=="") { //If tagname is empty
		callbackfx({ result: "failed" }, "true");
		notify("You must enter a name for this event.", "error");
		return;
	}
	$.ajax({
		type: "POST",
		url: "../process/process_editeventseries.php",
		data: { 
			seriesid: eseriesid, 
			name: ename,
			invited: einvited,
			teacher: eteacher,
			color: ecolor,
			visibility: evisibility,
			newtag: enewtag,
			tag: etag,
			hw: ehw,
			descrip: edescrip,
			events: eevents, 
			createeventseries: ecreateeventseries,
			rtms: ertms,
			edit: eedit
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

//ADD EVENT SERIES TO USER'S SCHEDULE
function addeventseriestoschedule(eseriesid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_addeventseriestoschedule.php",
		data: { 
			seriesid: eseriesid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

//DELETE AND REMOVE

function deleteeventseries(eseriesid, ertms, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_deleteeventseries.php",
		data: { 
			seriesid: eseriesid,
			rtms: ertms
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

function removeeventseriesfromschedule(eseriesid, edeleteevents, ertms, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_removeeventseriesfromschedule.php",
		data: { 
			seriesid: eseriesid,
			deleteevents: edeleteevents, //True or False string
			rtms: ertms
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

//ACCEPT/DECLINE INVITES

function accepteventseriesinvitation(seriesid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_addeventseriestoschedule.php",
		data: { 
			seriesid: seriesid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

function declineeventseriesinvitation(seriesid, permanentDecline, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_declineeventseriesinvitation.php",
		data: { 
			seriesid: seriesid,
			permanentDecline: permanentDecline
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}


///EVENT TAGS

//CREATE/DELETE EVENT TAG
function createtag(tname, tcolor, callbackfx) {
	if (tname=="") { //If tagname is empty
		callbackfx({ result: "failed" }, "true");
		notify("You must enter a name for this event.", "error");
		return;
	}
	$.ajax({
		type: "POST",
		url: "../process/process_createtag.php",
		data: { 
			name: tname,
			color: tcolor
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

function edittag(tid, tname, tcolor, tcolorevents, tevents, teventtagsview, tedit, tcreatetag, trtms, callbackfx) {
	if (tname=="") { //If tagname is empty
		callbackfx({ result: "failed" }, "true");
		notify("You must enter a name for this event.", "error");
		return;
	}
	$.ajax({
		type: "POST",
		url: "../process/process_editeventtag.php",
		data: { 
			tagid: tid,
			name: tname,
			color: tcolor,
			colorevents: tcolorevents,
			events: tevents,
			eventtagsview: teventtagsview,
			edit: tedit,
			createtag: tcreatetag,
			rtms: trtms
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

function deletetag(tid, teventtagsview, trtms, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_deletetag.php",
		data: {
			tagid: tid,
			eventtagsview: teventtagsview,
			rtms: trtms
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}


//COMPARE SCHEDULES GROUPS FUNCTIONS - CREATE/DELETE GROUP

function peoplegroups_create(groupname, memberIDs, callbackfx) {
	if (groupname=="") { //If tagname is empty
		notify("You must enter a name for this group.", "error");
		callbackfx({ result: "failed" }, "true");
		return;
	}
	memberIDs = JSON.stringify(memberIDs); //Convert Javascript Array -> JSON Array
	$.ajax({
		type: "POST",
		url: "../process/process_peoplegroups_create.php",
		data: { 
			name: groupname,
			personids: memberIDs
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

function peoplegroups_delete(groupid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_peoplegroups_delete.php",
		data: { 
			groupid: groupid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

function peoplegroups_getmembers(groupid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/return_peoplegroups_members.php",
		data: { 
			groupid: groupid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}


//FRIENDSDASHBOARD FUNCTIONS - ADD/DELETE PERSON FROM DASHBOARD

function friendsdashboard_addperson(personid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_friendsdashboard_addperson.php",
		data: { 
			personid: personid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		defaultAJAXresultcheck(param);
		callbackfx(param);
	});
}

function friendsdashboard_deleteperson(personid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_friendsdashboard_deleteperson.php",
		data: { 
			personid: personid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		defaultAJAXresultcheck(param);
		callbackfx(param);
	});
};



//MEETINGSDASHBOARD FUNCTIONS - ADD/DELETE PERSON FROM DASHBOARD

function meetingsdashboard_addperson(personid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_meetingsdashboard_addperson.php",
		data: { 
			personid: personid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		defaultAJAXresultcheck(param);
		callbackfx(param);
	});
}

function meetingsdashboard_deleteperson(personid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_meetingsdashboard_deleteperson.php",
		data: { 
			personid: personid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		defaultAJAXresultcheck(param);
		callbackfx(param);
	});
};



//HOMEWORK LOG DASHBOARD FUNCTIONS - ADD/DELETE EVENT FROM DASHBOARD

function hwlog_addevent(eventid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_hwlog_addevent.php",
		data: { 
			eventid: eventid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		defaultAJAXresultcheck(param);
		callbackfx(param);
	});
}

function hwlog_removeevent(eventid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_hwlog_removeevent.php",
		data: { 
			eventid: eventid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		defaultAJAXresultcheck(param);
		callbackfx(param);
	});
};

function hwlog_updateeventhw(eventid, hw, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_hwlog_updateeventhw.php",
		data: { 
			eventid: eventid,
			hw: hw
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		defaultAJAXresultcheck(param);
		callbackfx(param);
	});
};

function hwlog_updatecurrenthw(eventids, returncurrenthw, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_hwlog_updateeventhwtocurrenthw.php",
		data: { 
			eventids: eventids,
			returncurrenthw: returncurrenthw
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		defaultAJAXresultcheck(param);
		callbackfx(param);
	});
};



//ADDSCHEDULEEVENTS FUNCTIONS - HIDE EVENTS FROM DASHBOARD

function addscheduleevents_hideevent(eventid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_addscheduleevents_hideevent.php",
		data: { 
			eventid: eventid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}
//SHOW HIDDEN EVENTS ON DASHBOARD
function addscheduleevents_showhiddenevents(callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_addscheduleevents_showhiddenevents.php",
		data: {
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

//ADDEVENTSERIES FUNCTIONS - HIDE EVENTS FROM DASHBOARD

function addeventseries_hideseries(seriesid, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_addeventseries_hideseries.php",
		data: { 
			seriesid: seriesid
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}
//SHOW HIDDEN EVENT SERIES ON DASHBOARD
function addeventseries_showhiddenseries(callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_addeventseries_showhiddenseries.php",
		data: {
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}

//INVITE OTHERS TO JOIN BY EMAIL
function inviteothers(emails, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_inviteothers.php",
		data: {
			emails: emails
		},
		dataType: "JSON"
	})
	.done(function(param) {
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}


//PREFERENCES FUNCTIONS

//MAINSCHEDULEVIEW DASHBOARDS

function update_preferences_mainscheduleview(dashboardName, newStatus, callbackfx) {
	$.ajax({
		type: "POST",
		url: "../process/process_updatepreferences_mainscheduleview.php",
		data: {
			dashboardName: dashboardName,
			newStatus: newStatus
		},
		dataType: "JSON"
	})
	.done(function(param) { //Param- variable returned by PHP file
		callbackfx(param, defaultAJAXresultcheck(param));
	});
}
