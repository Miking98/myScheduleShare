$(document).ready(function() {

	init_compareschedulesdashboard_tagslist();


	//Remove all tags
	$(document.body).on("click", "#compareschedulesdashboard-tagslist-removeAll", function() {
		$("#compareschedulesdashboard-tagslist").select2("val", "");
	});
	
	//Prevent auto-refresh on Enter keypress
	$(document.body).on('keypress', '#compareschedulesdashboard-tagslist input', function (e) {                                       
		if (e.which == 13) {
			e.preventDefault();
		}
	});

	//Submit Compare Schedules
	$(document.body).on("click", "#compareschedulesdashboard-tagslist-submit", function(e) {
		var selections = $("#compareschedulesdashboard-tagslist").select2('data'); //Selected tags data
		var userIDsArray = [];
		for (var i = 0; i<selections.length; i++) {
			userIDsArray.push(selections[i].id); 
		}
		if (selections.length!=0) { //User has selected tags
			var useridsURL = http_build_query(userIDsArray, "userids");
			window.location.assign("/compareschedules.php?"+useridsURL);
		}
	});

	///////////////////////////////
	/// CREATE TAGS FOR A GROUP ///
	///////////////////////////////
	
	//Create groups
	$(document.body).on('click', '.compareschedules_groups:not(.compareschedulesgroups_groups_removegroup)', function() { //When <li> is clicked
		//Get friendids and friend names
		print_loadingicon("compareschedulesdashboard-tagslist-loadingicon");
		$.ajax({
			type: "POST", //POST data
			url: "../process/return_compareschedules_taggroups.php", //Secure schedule search PHP file
			data: { groupid: $(this).find(".compareschedules_groups_groupnum").val() }, //Send tags and group name
			dataType: "JSON" //Set datatype as JSON to send back params to AJAX function
		})
		.done(function(param) { //Param- variable returned by PHP file
			end_loadingicon("compareschedulesdashboard-tagslist-loadingicon");
			$("#compareschedulesdashboard-tagslist ").select2("val", ""); //Clear existing tags in input field
			for (i=0; i<param.length; i++) {
				returned_names.push(param[i].student_name); //Store name as a valid name in the returned_names array -- Prevents beforeTagAdded from returning false and preventing these tags from being added
				$("#compareschedulesdashboard-tagslist ").select2("val", param[i].student_name, param[i].student_id);
			}
		});	
	});

});