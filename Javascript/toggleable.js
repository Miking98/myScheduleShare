$(document).ready(function() {
	$(document.body).on('click', '.toggleshow', function(e) {
		var $parent = $(this).parents(".toggleable-group"); //Toggleable container div
		var clicked = $(this); //Toggle thing that was clicked
		//Show toggleable div that should be shown with this toggleshow
		if (!clicked.is("[togglewith]")) { //If this had a "togglewith" attribute, then this thing could only be toggled WITH something else, but cannot itself initiate a toggle - Thus, this clicked thing musn't have the togglewith attribute
			//Hide all toggleshow <span>s and <div>s
			$parent.find(".toggleshow").hide();
			$parent.find(".toggleable").each(function() {
				if ($(this).attr("togglewith")==clicked.attr("id")) { //This is the toggle thing that as clicked (OR is a <div> or <span> connected to it with the togglewith attribute)
					$(this).show();
				}
				else { //This should be toggled because it wasn't clicked
					$(this).hide();
				}
			});
		}
	});
	$(document.body).on('click', '.togglehide', function(e) {
		var $parent = $(this).parents(".toggleable-group"); //Toggleable container div
		var clicked = $(this); //Toggle thing that was clicked
		//Show toggleable div that should be shown with this toggleshow
		if (!clicked.is("[togglewith]")) { //If this had a "togglewith" attribute, then this thing could only be toggled WITH something else, but cannot itself initiate a toggle - Thus, this clicked thing musn't have the togglewith attribute
			//Hide all toggleable <div>s
			$parent.find(".toggleable").hide();
			$parent.find(".toggleshow").show();
		}
	});
});

/*
	Alttext -> HTML Attribute - tells Toggleable.js what text to replace the current text with
			<span alttext="Cancel">Create tag</span> ==> <span alttext="Create tag">Cancel</span>
	Togglewith -> HTML Attribute - tells Toggleable.js that this element should be toggled when another element with this ID is toggled
			<span togglewith="toggleme">This will toggle when toggleme is clicked</span>
			<span id="toggleme">Toggleme</span>
*/