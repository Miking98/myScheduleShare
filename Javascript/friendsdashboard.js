$(document).ready(function() {
	
	//Initialize schedule snapshots
	init_schedulesnapshot();
	//Recalculate current time cursor position every 5 minutes
	var cursorcalc=setInterval(schedulesnapshot_adjustcurrenttimecursor,300000);

	var deleteiconisactivated = false;

	////////////////////////////
	//// SEARCH FOR TEACHERS ///
	////////////////////////////

	//Search for people every time a user types in a key
	$("#content-content_friendsdashboard").on('keyup', '#friendsdashboard-addperson-search', function(e) {
		var searchquery = $(this).val();
		var searchresults = $("#friendsdashboard-addperson-searchresult");
		if (searchquery=="") { //If query is ""
			//Clear search results
			searchresults.hide().html();
		}
		else {
			$.ajax({
				type: "POST",
				url: "../process/return_allpeople_friendsdashboard.php",
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
					var students = [];
					students = $.map(param, function(obj) {
						return {
							id: obj.id,
							name: obj.name
						}
					});
					if (students.length>0) { //There are search results
						for (var i = 0; i<students.length; i++) {
							resulthtml+='<div class="friendsdashboard-addperson-searchresult-person search-result tooltip tooltip-hover" title="Add '+students[i].name+'">'+
											'<input type="hidden" class="friendsdashboard-person-personid" value="'+students[i].id+'">'+
											'<div class="addbtn approvereject_btn"><div class="addbtn_plus">+</div></div>'+
											'<div class="friendsdashboard-person-personname">'+students[i].name+'</div>'+
										'</div>';
						}
						searchresults.html(resulthtml).slideDown();
					}
					else { //No search results
						searchresults.html("No search results").show();
					}

				}
			});
		}
	});


	///// TOGGLE ADD PERSON CONTAINER ////
	
	$("#content-content_friendsdashboard").on('click', '.friendsdashboard-addperson-toggle', function() {
		$(".friendsdashboard-addperson-container").slideToggle();
		$("#friendsdashboard-addperson-search").focus().val("");
		$("#friendsdashboard-addperson-searchresult").html("").hide();
	});
	
	///// DELETE PERSON ////
	
	//When Remove action-link is clicked, add delete icons to every person profile
	$("#content-content_friendsdashboard").on('click','#friendsdashboard-removeperson', function() {
		$(".friendsdashboard-person-delete").show(); //Show delete icon
		$(".friendsdashboard-person-profile").removeClass("tooltip"); //Prevent "Schedule meeting with..." tooltip when div is hovered over
		$(".friendsdashboard-person-profile-content").css("padding-left","25px"); //Add padding to push content to the right of delete icon
		deleteiconisactivated = true;
	});

	//When any part of document.body is clicked besides delete icons, remove them
	$(document.body).mouseup(function (e) {
		var container = $(".friendsdashboard-person-profile");
		if (!container.is(e.target) // if the target of the click isn't the container...
	    && container.has(e.target).length === 0) // ... nor a descendant of the container
		{
			$(".friendsdashboard-person-delete").hide(); //Hide delete icon
			container.addClass("tooltip"); //Add back "Schedule meeting with..." tooltip when div is hovered over
			$(".friendsdashboard-person-profile-content").css("padding-left","0px"); //Remove padding that pushed content to the right of delete icon
			deleteiconisactivated = false;
		}
		else {
		}
	});

	//When delete button is clicked, call deleteperson() function
	$("#content-content_friendsdashboard").on('click','.friendsdashboard-person-delete', function() {
		var personid = $(this).siblings(".friendsdashboard-person-profile-content").find(".friendsdashboard-person-profile-personid").val();
		var personname = $(this).siblings(".friendsdashboard-person-profile-content").find(".friendsdashboard-person-profile-personname").text();
		friendsdashboard_deleteperson(personid, function(param) {
			if (param.result=="success") { //Success
				notify("Successfully removed <strong>"+personname+"</strong> from your dashboard.", "success");
				refresh_ajaxelements("content_friendsdashboard"); //Just refresh Meetings Dashboard
			}
		});
	});

	///// ADD PERSON ////
	
	
	//When add button is clicked, call addperson() function
	$("#content-content_friendsdashboard").on('click','.friendsdashboard-addperson-searchresult-person', function() {
		var personid = $(this).children(".friendsdashboard-person-personid").val();
		var personname = $(this).children(".friendsdashboard-person-personname").text();
		friendsdashboard_addperson(personid, function(param) {
			if (param.result=="success") { //Success
				notify("Successfully added <strong>"+personname+"</strong> to your dashboard.", "success");
				refresh_ajaxelements("content_friendsdashboard"); //Just refresh Meetings Dashboard
			}
		});
	});

});	