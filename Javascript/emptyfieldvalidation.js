$(document).ready(function() {
	//Prevent form from being submit if there are empty fields
	$('.noemptyfields').submit(function(e) {
		$form = $(this);
		var empty = checkeverything($form);
		if (empty) { //Something is empty
			e.preventDefault();
			if ($(this).hasClass("noerrordiv")) { }
			else { $('<div class="alert alert-error emptyformfieldalerterror"><div class="closedialogx">[ X ]</div>ERROR- One or more fields is empty.</div>').appendTo($form); } //Show error div
		}
		else { //Prevent multiple form submissions
			$form.submit(function () {
				return false;
			});
			return true;
		}
	});
	
	
	//Prevent AJAX form from being submit if there are empty fields
	$(document.body).on('click','.ajax-submitbtn', function(e) {
		$form = $(this).parents('form.noemptyfields')
		var empty = checkeverything($form);
		if (empty) { //Something is empty
			e.preventDefault();
			if ($(this).hasClass("noerrordiv")) { }
			else { $('<div class="alert alert-error emptyformfieldalerterror"><div class="closedialogx">[ X ]</div>ERROR- One or more fields is empty.</div>').appendTo($form); } //Show error div
		}
		else {
		}
	});
	
	$("#page").on("blur",".emptyformhighlite", function() {
		if ($(this).val()=="") { }
		else { $(this).removeClass('emptyformhighlite').removeClass("highlite-error"); }
	});
});

function checkeverything($form) {
	var empty = false;
	clearcurrenthighlites($form);
	//Check inputs and selects
	var emptyinputs = checkinputs($form);
	//Check Select2 dropdowns
	var emptyselect2 = checkselect2($form);
	//Check WYSIWYG TINYMCE fields
	var emptywysiwyg = checkwysiwyg($form);
	if (emptyinputs||emptyselect2||emptywysiwyg) {
		empty = true;
	}
	return empty;
}

function checkinputs($form) {
	var isempty = false;
	//Check if any inputs or selects are empty
	$form.find("input, select").each(function() { //For each input and select
		if ($(this).hasClass("optionalfield")||$(this).hasClass("ui-autocomplete-input")||$(this).hasClass("select2-focusser")||$(this).hasClass("select2-input")) { //This field is optional
		}
		else {
			if ($(this).val().trim()=="") { //No input or only whitespace
				$(this).addClass("emptyformhighlite").addClass("highlite-error"); //Add highlites to inputs that are empty
				isempty = true; //Error = true
			}
		}
	});
	return isempty;
}
function checkselect2($form) {
	var isempty = false;
	//Check if select2s are empty
	$form.find(".select2-container").each(function() {
		var hidden_input = $(this).siblings("input[type=hidden].select2-offscreen");
		if ((hidden_input.val()=="")&&(!hidden_input.hasClass("optionalfield"))) { //Select box hasn't selected anything
			$(this).addClass("emptyformhighlite").addClass("highlite-error"); //Add highlites to inputs that are empty
			isempty = true; //Error = true
		}
	})
	return isempty;
}


function checkwysiwyg($form) {
	var isempty = false;
	for (edId in tinyMCE.editors) { //For each WYSIWYG iFrame
		if ($form.find("#"+edId).length>0) { //WYSIWYG is in this Form
			var content = tinyMCE.editors[edId].getContent();
			if (content.trim()=="") { //No input or only whitespace
				$("#"+tinyMCE.editors[edId].contentAreaContainer.id).parent().addClass('emptyformhighlite'); //Add highlites to inputs that are empty
				isempty = true; //Error = true
			}
		}
		else { //Not in this form, so not relevant
		}
	}
	return isempty;
}


function clearcurrenthighlites($form) {
	$form.find('.emptyformhighlite').removeClass('emptyformhighlite').removeClass("highlite-error"); //Remove highlites
	$form.find('.emptyformfieldalerterror').hide(); //Hide error div
}