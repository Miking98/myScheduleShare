<?php
	/*

	JSONEncodable
		getjsondata()	Returns JSON string encoding Object it was called on
		
		Used in:
			secureclasses.php
				All other Classes
	idname
		Int 		ID
		String		name
		Array		info
	
		Used in:
			pickschool.php
				Name: String value of school, ID: Integer school ID
			return_hwlogevents.php
				Name: Name of event, ID: Integer event ID, info[0]: Event's occurs when string
			account.pnp
				Name: String of most taken event at a school, ID: Event ID

	person
		Int 					ID
		String					name
		Int 					type of member
		Int 					school ID
		Int 					grade
		Bool 					busy or free
		Array 					Scheduleevent objects

		Used in:
			content_friendsdashboard.php
				Friends
			content_compareschedulesgroups.php
				Person Groups
			functions.php
				convertQueryToScheduleEventObjects()

	personGroup
		Int						ID
		String					name
		Int						createdby ID
		Array					Person Objects

		Used in:
			content_compareschedulesgroups.php
				Group of Person Objects


	RecursObj


		Used in:
			editevent.php
				Recurring Event Information storage

	eventtag
		Used in:
			editeventtag.php
				Event Tag storage
			functions.php
				convertQueryToScheduleEventObjects()

	eventseries

		Used in:
			functions.php
				getEventSeriesInformation()
			editeventseries.php
				Event Series storage
			eventseriesview.php
				Event Series storage
			content_addeventseries_eventseries.php
				Event Series storage
			return_alleventseres
				Event Series storage

	scheduleevent
		Int						ID
		Int						createdby
		String					name
		Int						starttime
		Int						endtime
		String					description
		Int						recur
		String					color
		Array [Person Objects]	sharedwith
		
		Used in:
			return_scheduleevents.php
				Store schedule events data
			content_eventslist_scheduleevents.php
				Store schedule events data
			content_meetingsdashboard.php
				Store meetings data
	*/
	
	
	//JSON Encode arrays and objects
	class JSONEncodable {
		//JSON encoding
		public function getjsondata() {
			$var = get_object_vars($this);
			foreach($var as &$value){
				if(is_object($value) && method_exists($value,'getjsondata')){
					$value = $value->getjsondata();
				}
				else if (is_array($value)) { //To handle object -> array of objects
					foreach($value as &$objInArray){
						if (is_object($objInArray) && method_exists($objInArray,'getjsondata')){
							$objInArray = $objInArray->getjsondata();
						}
					}
			   }
			}
			return $var;
		}

	}

	class idname extends JSONEncodable { //Generic class for data with ID and name
		protected $id = 0; //ID
		protected $name = ""; //Name
		protected $info = array(); //Extra information

		//Constructor
		function __construct($id, $name, $info = array()) {
			$this->id = $id;
			$this->name = $name;
			$this->info = $info;
		} 
    	
		//Setter functions
		public function setid($id) {
			$this->id = $id;
		}
		public function setname($name) {
			$this->name = $name;
		}
		public function setinfo($info) {
			$this->info = $info;
		}
		
		//Getter functions
		public function getid() {
			return $this->id;
		}
		public function getname() {
			return $this->name;
		}
		public function getinfo() {
			return $this->info;
		}
	}

	class person extends JSONEncodable { //Generic class for person
		protected $id = 0; //ID
		protected $name = ""; //Name
		protected $email = ""; //Email
		protected $tom = 0; //Type of member
		protected $schoolid = 0; //School ID
		protected $grade = 0; //Grade
		protected $busy = true; //Boolean - busy (has event right now) or free
		protected $numSharedEvents = 0; //Number of events shared with current user
		protected $events = array(); //Array of Scheduleevent Objects
		protected $goingStatus = 0; //If event is private, -1 if declined event, 0 if maybe, 1 if accepted and going
		protected $goingStatusName = ""; //String of Going status, like occurs info - "Yes", "No", or "Maybe"
		
		//Constructor
		function __construct($id, $name, $tom, $schoolid, $grade, $busy, $numSharedEvents = 0, $scheduleevents = array(), $goingStatus = 0) {
			$this->id = $id;
			$this->name = $name;
			$this->tom = $tom;
			$this->schoolid = $schoolid;
			$this->grade = $grade;
			$this->busy = $busy;
			$this->numSharedEvents = $numSharedEvents;
			$this->events = $scheduleevents;
			$this->goingStatus = $goingStatus;
		} 
    	
    	//Tell PHP what variables to serialize when JSON encoding
		function __sleep() {
			return array('id', 'name', 'tom', 'schoolid', 'grade', 'busy', 'numSharedEvents', 'events', 'goingStatus');
		}

		//Setter functions
		public function setid($id) {
			$this->id = $id;
		}
		public function setemail($email) {
			$this->email = $email;
		}
		public function setname($name) {
			$this->name = $name;
		}
		public function settom($tom) {
			$this->tom = $tom;
		}
		public function setschoolid($schoolid) {
			$this->schoolid = $schoolid;
		}
		public function setbusy($busy) {
			$this->busy = $busy;
		}
		public function addevent($scheduleeventobj) {
			$this->events[] = $scheduleeventobj;
		}
		
		//Getter functions
		public function getid() {
			return $this->id;
		}
		public function getemail() {
			return $this->email;
		}
		public function getname() {
			return $this->name;
		}
		public function gettom() {
			return $this->tom;
		}
		public function getschoolid() {
			return $this->schoolid;
		}
		public function getgrade() {
			return $this->grade;
		}
		public function getbusy() {
			return $this->busy;
		}
		public function getnumSharedEvents() {
			return $this->numSharedEvents;
		}
		public function getevents() {
			return $this->events;
		}
		public function geteventnames() {
			$events = $this->events;
			$eventnames = array();
			for ($i = 0; $i<count($events); $i++) {
				$eventnames[] = $events[$i]->getname();
			}
			return $eventnames;
		}
		public function getgoingstatus() {
			return $this->goingStatus;
		}
		public function getgoingstatusname() {
			$g = $this->getgoingstatus();
			if ($g==-1) {
				return "No";
			}
			else if ($g==1) {
				return "Yes";
			}
			else {
				return "Maybe";
			}
		}

		
		//JSON encoding
		public function getjsondata() {
			//Set goingStatusName before we JSON encode this object
			$this->goingStatusName = $this->getgoingstatusname();

			return parent::getjsondata();
		}
	}

	class personGroup extends JSONEncodable { //Class for a group of people 
		protected $id = 0; //Group ID
		protected $name = ""; //Group Name
		protected $createdby = 0; //Creator's ID
		protected $persons = array(); //Array of Person Objects

		//Constructor
		function __construct($id, $name, $createdby, $persons = array()) {
			$this->id = $id;
			$this->name = $name;
			$this->createdby = $createdby;
			$this->persons = $persons;
		} 
    	
		//Setter functions
		public function setid($id) {
			$this->id = $id;
		}
		public function setname($name) {
			$this->name = $name;
		}
		public function setcreatedby($createdby) {
			$this->createdby = $createdby;
		}
		public function addperson($personobj) {
			$this->persons[] = $personobj;
		}
		
		//Getter functions
		public function getid() {
			return $this->id;
		}
		public function getname() {
			return $this->name;
		}
		public function getcreatedby() {
			return $this->createdby;
		}
		public function getpersons() {
			return $this->persons;
		}
		public function getpersonnames() {
			$persons = $this->persons;
			$personnames = array();
			for ($i = 0; $i<count($persons); $i++) {
				$personnames[] = $persons->getname();
			}
			return $personnames;
		}
	}

	class eventtag extends JSONEncodable {
		protected $id = 0; //Event tag ID
		protected $belongsto = 0; //Person Obj of person event tag belongs to
		protected $createddate = 0; //UNIX when eventtag was created
		protected $lastmodified = 0; //UNIX when last modified
		protected $name = ""; //Name of event tag
		protected $color = ""; //Color of event tag
		protected $colorevents = 0; //Color tagged events this tag's color
		protected $scheduleevents = array(); //Array of Schedule Event Objects tagged with this event tag

		//Constructor
		function __construct($id, $belongsto, $createddate, $lastmodified, $name, $color, $colorevents, $scheduleeventsarray = array()) {
			$this->id = $id;
			$this->belongsto = $belongsto;
			$this->createddate = $createddate;
			$this->lastmodified = $lastmodified;
			$this->name = $name;
			$this->color = $color;
			$this->colorevents = $colorevents;
			$this->scheduleevents = $scheduleeventsarray;
		}

		//Setter and Getter functions

		public function addscheduleevent($eventobj) {
			$this->scheduleevents[] = $eventobj;
		}
		public function setscheduleevents($arrayofeventobjs) {
			$this->scheduleevents = $arrayofeventobjs;
		}

		public function getid() {
			return $this->id;
		}
		public function getbelongsto() {
			return $this->belongsto;
		}
		public function getbelognstoid() {
			if (!is_null($this->belongsto)) {
				return $this->belongsto->getid();
			}
			return 0;
		}
		public function getbelongstoname() {
			if (!is_null($this->belongsto)) {
				return $this->belongsto->getname();
			}
			return "";
		}
		public function getname() {
			return $this->name;
		}
		public function getcolor() {
			return $this->color;
		}
		public function getcolorevents() {
			return $this->colorevents;
		}
		public function getscheduleevents() {
			return $this->scheduleevents;
		}
		public function getnumberofscheduleevents() {
			return count($this->scheduleevents);
		}
	}


	class eventseries extends JSONEncodable {
		protected $id = 0; //Series ID
		protected $belongsto = null; //Person Object
		protected $createdby = null; //Person Object
		protected $createddate = 0; //UNIX timestamp when series was created
		//Name
		protected $name = ""; //Name of event series
		//Visibility
		protected $visibility = 0; //1 if visible to everyone (public), 0 if protected
		//Appearance
		protected $color = ""; //Color
		//Descriptive information
		protected $hw = ""; //HW for event series
		protected $description = ""; //Description of event series
		protected $tag = null; //Eventtag Object of event's tag
		//Teacher
		protected $teacher = null; //Person Object of teacher
		//Invited people (people who can see this event)
		protected $invited = array(); //Array of Person Objects of people who can see this series (e.g. are invited to follow it)
		//Shared with
		protected $sharedwith = array(); //Array of Person objects
		//Events
		protected $events = array(); //Array of Schedule Event objects that this Event Series has

		//Current user's permissions for events he's invited to
		protected $perms_modify = false;
		protected $perms_seeothers = false;
		protected $perms_inviteothers = false;

		//Constructor
		function __construct($id, $belongsto, $createdby, 
							$name, 
							$visibility, 
							$color, $hw, $description, 
							$tag, $teacher) {
			$this->id = $id;
			$this->belongsto = $belongsto;
			$this->createdby = $createdby;
			$this->name = $name;
			$this->visibility = $visibility;
			$this->color = $color;
			$this->hw = $hw;
			$this->description = $description;
			$this->tag = $tag;
			$this->teacher = $teacher;
		}

		//Setter and Getter functions

		public function addscheduleevent($eventobj) { //Accepts singular Schedule Event object
			$this->events[] = $eventobj;
		}
		public function addscheduleevents($eventobjs) { //Accepts array of Schedule Event objects (for output of currentQueryToScheduleEventObject() function)
			for ($i = 0; $i<count($eventobjs); $i++) {
				$this->events[] = $eventobjs[$i];
			}
		}
		public function setscheduleevents($eventobjs) {
			$this->events = $eventobjs;
		}
		public function sethw($hw) {
			$this->hw = $hw;
		}
		public function setsharedwith($sharedwith) {
			$this->sharedwith = $sharedwith;
		}
		public function addsharedwithperson($personobj) {
			$this->sharedwith[] = $personobj;
		}
		public function setperms_modify($modify) {
			if (is_null($modify)) {
				$modify = false;
			}
			$this->perms_modify = $modify;
		}
		public function setperms_seeothers($seeothers) {
			if (is_null($seeothers)) {
				$seeothers = false;
			}
			$this->perms_seeothers = $seeothers;
		}
		public function setperms_inviteothers($inviteothers) {
			if (is_null($inviteothers)) {
				$inviteothers = false;
			}
			$this->perms_inviteothers = $inviteothers;
		}

		public function getid() {
			return $this->id;
		}
		public function getcreateddate() {
			return $this->createddate;
		}
		public function getcreatedby() {
			return $this->createdby;
		}
		public function getcreatedbyid() {
			if (!is_null($this->createdby)) {
				return $this->createdby->getid();
			}
			return "";
		}
		public function getcreatedbyname() {
			if (!is_null($this->createdby)) {
				return $this->createdby->getname();
			}
			return "";
		}
		public function getname() {
			return $this->name;
		}
		public function getcolor() {
			return $this->color;
		}
		public function getvisibility() {
			return $this->visibility;
		}
		public function gethw() {
			return $this->hw;
		}
		public function getdescription() {
			return $this->description;
		}
		public function getteacher() {
			return $this->teacher;
		}
		public function getteacherid() {
			if (!is_null($this->teacher)) {
				return $this->teacher->getid();
			}
			return 0;
		}
		public function getteachername() {
			if (!is_null($this->teacher)) {
				return $this->teacher->getname();
			}
			return "";
		}
		public function getsharedwith() {
			return $this->sharedwith;
		}
		public function getinvited() {
			return $this->invited;
		}
		public function getperms_modify($currentUserID = null) {
			//If Current User created series, he has all the permissions
			if (!is_null($currentUserID)&&(int) $currentUserID === (int) $this->getcreatedbyid()) {
				return true;
			}
			return $this->perms_modify;
		}
		public function getperms_seeothers($currentUserID = null) {
			if (!is_null($currentUserID)&&(int) $currentUserID === (int) $this->getcreatedbyid()) {
				return true;
			}
			return $this->perms_seeothers;
		}
		public function getperms_inviteothers($currentUserID = null) {
			if (!is_null($currentUserID)&&(int) $currentUserID === (int) $this->getcreatedbyid()) {
				return true;
			}
			return $this->perms_inviteothers;
		}
		public function getscheduleevents() {
			return $this->events;
		}
		public function getnumberofscheduleevents() {
			return count($this->events);
		}
	}

	class scheduleevent extends JSONEncodable {
		protected $id = 0; //Unique schedule event ID
		//Metadata - Created by and Belongs to
		protected $belongsto = null; //Person Obj of user whose schedule this event is being derived from
		protected $createdby = null; //Person Obj of user who created schedule event
		//Name
		protected $name = ""; //Name of schedule event
		//Start, end, recurs info
		protected $starttime = 0; //Start time (in seconds)
		protected $endtime = 0; //End time (in seconds)
		protected $startutc = ""; //Start time (in UTC)
		protected $endutc = ""; //End time (in UTC)
		protected $allday = false; //All day
		protected $recur = 0; //Recurrence integer
		protected $recurobj = null; //Recurs Event Object
		protected $occursinfo = ""; //Occurs Info (Time, date, recurrings summary string)
		//Visibility
		protected $visibility = 0; //Visibility (1 if public, 0 if protected)
		//Appearance
		protected $color = ""; //Color
		//Descriptive school information
		protected $hw = ""; //Homework for this event
		protected $description = ""; //Description of schedule event
		protected $tag = null; //Eventtag Object of event's tag
		//Teacher
		protected $teacher = null; //Person Object of teacher
		//Invited people (people who can see this event)
		protected $invited = array(); //Array of Person Objects of people who can see this event (e.g. are invited attend it)
		//Shared with
		protected $sharedwith = array(); //Array of Person objects
		//Event Series
		protected $eventseries = array(); //Array of Event Series objects that this Event belongs to

		//Current user's permissions for events he's invited to
		protected $perms_modify = false;
		protected $perms_seeothers = false;
		protected $perms_inviteothers = false;

		//Constructor
		function __construct($id, $belongsto, $createdby,
							$name, $starttime, $endtime, $startutc, $endutc, $allday, $recur, $recurobj, $occursinfo,
							$visibility, $color, $hw, $description, $tag, $teacher, 
							$invited = array(), $sharedwith = array(), $eventseries = array()) {
			$this->id = $id;
			$this->belongsto = $belongsto;
			$this->createdby = $createdby;
			$this->name = $name;
			$this->starttime = $starttime;
			$this->endtime = $endtime;
			$this->startutc = $startutc;
			$this->endutc = $endutc;
			$this->allday = $allday;
			$this->recur = $recur;
			$this->recurobj = $recurobj;
			$this->occursinfo = $occursinfo;
			$this->visibility = $visibility;
			$this->color = $color;
			$this->hw = $hw;
			$this->description = $description;
			$this->tag = $tag;
			$this->teacher = $teacher;
			$this->invited = $invited;
			$this->sharedwith = $sharedwith;
			$this->eventseries = $eventseries;
		} 
		    	
		//Setter and Getter functions
		
		public function setid($id) {
			$this->id = $id;
		}
		public function setbelongsto($belongsto) {
			$this->belongsto = $belongsto;
		}
		public function setbelongstoid($id) {
			$this->belongsto->setid($id);
		}
		public function setbelongstoname($name) {
			$this->belongsto->setname($name);
		}
		public function setcreatedby($createdby) {
			$this->createdby = $createdby;
		}
		public function setcreatedbyid($id) {
			$this->createdby->setid($id);
		}
		public function setcreatedbyname($name) {
			$this->createdby->setname($name);
		}
		public function setname($name) {
			$this->name = $name;
		}
		public function setstarttime($starttime) {
			$this->starttime = $starttime;
		}
		public function setendtime($endtime) {
			$this->endtime = $endtime;
		}
		public function setallday($allday) {
			$this->allday = $allday;
		}
		public function setrecur($recur) {
			$this->recur = $recur;
		}
		public function setrecurobj($eventBlockStart, $eventBlockEnd, $day, $week, $dayOfWeek, $month, $dayOfMonth, $dayOccurrenceInMonth, $year, $thisMonth, $endsNever, $endsAfter, $endsAfterOccurrences, $endsBy, $endsByTime) {
			$this->recurobj = new RecursObj($eventBlockStart, $eventBlockEnd, $day, $week, $dayOfWeek, $month, $dayOfMonth, $dayOccurrenceInMonth, $year, $thisMonth, $endsNever, $endsAfter, $endsAfterOccurrences, $endsBy, $endsByTime);
		}
		public function setrecurobjwithobj($obj) {
			$this->recurobj = $obj;
		}
		public function setvisibility($visibility) {
			$this->visibility = $visibility;
		}
		public function setcolor($color) {
			$this->color = $color;
		}
		public function sethw($hw) {
			$this->hw = $hw;
		}
		public function setdescription($description) {
			$this->description = $description;
		}
		public function settag($tag) {
			$this->tag = $tag;
		}
		public function settagid($tagid) {
			$this->tag->setid($tagid);
		}
		public function settagname($tagname) {
			$this->tag->setname($tagname);
		}
		public function setteacher($teacher) {
			$this->teacher = $teacher;
		}
		public function setinvited($invited) {
			$this->invited = $invited;
		}
		public function setsharedwith($sharedwith) {
			$this->sharedwith = $sharedwith;
		}
		public function addsharedwithperson($personobj) {
			$this->sharedwith[] = $personobj;
		}
		public function addeventseries($eventseriesobj) {
			$this->eventseries[] = $eventseriesobj;
		}
		public function setperms_modify($modify) {
			if (is_null($modify)) {
				$modify = false;
			}
			$this->perms_modify = $modify;
		}
		public function setperms_seeothers($seeothers) {
			if (is_null($seeothers)) {
				$seeothers = false;
			}
			$this->perms_seeothers = $seeothers;
		}
		public function setperms_inviteothers($inviteothers) {
			if (is_null($inviteothers)) {
				$inviteothers = false;
			}
			$this->perms_inviteothers = $inviteothers;
		}

		public function getid() {
			return $this->id;
		}
		public function getbelongsto() {
			return $this->belongsto;
		}
		public function getbelongstoid() {
			if (!is_null($this->belongsto)) {
				return $this->belongsto->getid();
			}
			return 0;
		}
		public function getbelongstoname() {
			if (!is_null($this->belongsto)) {
				return $this->belongsto->getname();
			}
			return "";
		}
		public function getcreatedby() {
			return $this->createdby;
		}
		public function getcreatedbyid() {
			if (!is_null($this->createdby)) {
				return $this->createdby->getid();
			}
			return 0;
		}
		public function getcreatedbyname() {
			if (!is_null($this->createdby)) {
				return $this->createdby->getname();
			}
			return "";
		}
		public function getname() {
			return $this->name;
		}
		public function getstarttime() {
			return $this->starttime;
		}
		public function getendtime() {
			return $this->endtime;
		}
		public function getallday() {
			return $this->allday;
		}
		public function getrecur() {
			return $this->recur;
		}
		public function getrecurobj() {
			return $this->recurobj;
		}
		public function getrecurobjsummary() {
			if ($this->getrecur()==1&&!is_null($this->recurobj)) {
				return $this->recurobj->getSummary();
			}
			else {
				return "";
			}
		}
		public function getoccursinfo() {
			if ($this->getrecur()==1&&!is_null($this->recurobj)) {
				return $this->getrecurobjsummary();
			}
			else {
				$endtime = $this->getendtime();
				//Because FullCalendar+MomentJS is EXCLUSIVE, subtract one from $endtime to get it to same day as $starttime
				//E.g. 00:00:00 on Friday really ends on Thursday
				if ($this->getallday()==1) {
					$endtime -= 1;
				}
				$occursinfo = formatetimeanddate($this->getstarttime(), $endtime, $this->getallday(), $this->getrecur());
				return $occursinfo[0].", ".$occursinfo[1];
			}

		}
		public function getformatted_date() {
			$endtime = $this->getendtime();
			if ($this->getallday()==1) {
				$endtime-=1;
			}
			$occursinfo = formatetimeanddate($this->getstarttime(), $endtime, $this->getallday(), $this->getrecur());
			return $occursinfo[1];
		}
		public function getformatted_time() {
			$endtime = $this->getendtime();
			$occursinfo = formatetimeanddate($this->getstarttime(), $endtime, $this->getallday(), $this->getrecur());
			return $occursinfo[0];
		}
		public function getformatted_startdate() {
			return gmdate("m/d/Y", $this->getstarttime());
		}
		public function getformatted_enddate() {
			$endtime = $this->getendtime();
			if ($this->getallday()==1) {
				$endtime -= 1;
			}
			return gmdate("m/d/Y", $endtime);
		}
		public function getformatted_starttime() {
			return gmdate("g:ia", $this->getstarttime());
		}
		public function getformatted_endtime() {
			$endtime = $this->getendtime();
			return gmdate("g:ia", $endtime);
		}
		public function getvisibility() {
			return $this->visibility;
		}
		public function getcolor() {
			return $this->color;
		}
		public function gethw() {
			return $this->hw;
		}
		public function getdescription() {
			return $this->description;
		}
		public function gettag() {
			return $this->tag;
		}
		public function gettagid() {
			if (!is_null($this->tag)) {
				return $this->tag->getid();
			}
			return 0;
		}
		public function gettagname() {
			if (!is_null($this->tag)) {
				return $this->tag->getname();
			}
			return "";
		}
		public function getteacher() {
			return $this->teacher;
		}
		public function getteacherid() {
			if (!is_null($this->teacher)) {
				return $this->teacher->getid();
			}
			return 0;
		}
		public function getteachername() {
			if (!is_null($this->teacher)) {
				return $this->teacher->getname();
			}
			return "";
		}
		public function getinvited() {
			return $this->invited;
		}
		public function getsharedwith() {
			return $this->sharedwith;
		}
		public function getsharedwithnames() {
			$sharedwith = $this->getsharedwith();
			$sharedWithNames = array();
			for ($i = 0; $i<count($sharedwith); $i++) {
				$sharedWithNames[] = $sharedwith[$i]->getname();
			}
			return $sharedWithNames;
		}
		public function getsharedwithcount() {
			return count($this->sharedwith);
		}
		public function geteventseries() {
			return $this->eventseries;
		}
		public function getperms_modify($currentUserID = null) {
			//If Current User created event, he has all the permissions
			if (!is_null($currentUserID)&&(int) $currentUserID === (int) $this->getcreatedbyid()) {
				return true;
			}
			return $this->perms_modify;
		}
		public function getperms_seeothers($currentUserID = null) {
			if (!is_null($currentUserID)&&(int) $currentUserID === (int) $this->getcreatedbyid()) {
				return true;
			}
			return $this->perms_seeothers;
		}
		public function getperms_inviteothers($currentUserID = null) {
			if (!is_null($currentUserID)&&(int) $currentUserID === (int) $this->getcreatedbyid()) {
				return true;
			}
			return $this->perms_inviteothers;
		}
		
		//JSON encoding
		public function getjsondata() {
			//Set occursinfo before we JSON encode this object
			$this->occursinfo = $this->getoccursinfo();

			return parent::getjsondata();
		}
	}

	class RecursObj extends JSONEncodable {
		protected $eventBlockStart = 0; //Int - UNIX start time for this event block (e.g. Sunday 21, 2013 4:00pm)
		protected $eventBlockEnd = 0; //Int - UNIX end time for this event block (e.g. Sunday 21, 2013 7:00pm); this block itself is what gets repeated to create the overarching "Event"
		protected $allDay = false; //Boolean - Whether this event is all day or not

		protected $day = "*"; //String - This event repeats every _ days
		protected $week = "*"; //String - This event repeats every _ weeks
		protected $dayOfWeek = array(); //2-D Array - This event repeats every [0][0], for Sunday, Monday, etc. [0][1] for starttime, UNIX [0][2] for endtime, UNIX
		protected $month = "*"; //String - This event repeats every _ months
		protected $dayOfMonth = "*"; //String - This event repeats every _ days
		protected $dayOccurrenceInMonth = "*"; //Int - 1-5, will be placed after # is the 1st, 2nd, 3rd, 4th, last per month ; 
		protected $year = "*"; //String - This event repeats every _ years
		protected $thisMonth = "*"; //String - This event repeats every _ month of the year

		protected $endsNever = true; //Boolean - Recurring event never ends
		protected $endsAfter = false; //Boolean - Recurring event ends after x occurrences
		protected $endsAfterOccurrences = 0; //Int - Event ends after _ occurrences
		protected $endsBy = false; //Boolean - Recurring event ends by some date
		protected $endsByTime = 0; //Int UNIX time for the end of the day that this event stops recurring on
		
		protected $days = array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
		protected $months = array('January','February','March','April','May','June','July','August','September','October','November','December');

		function __construct($eventBlockStart, $eventBlockEnd, $allDay, $day, $week, $dayOfWeek, $month, $dayOfMonth, $dayOccurrenceInMonth, $year, $thisMonth, $endsNever, $endsAfter, $endsAfterOccurrences, $endsBy, $endsByTime) {
			$this->eventBlockStart = $eventBlockStart;
			$this->eventBlockEnd = $eventBlockEnd;
			$this->allDay = $allDay;
			$this->day = $day;
			$this->week = $week;
			$this->dayOfWeek = $dayOfWeek;
			$this->month = $month;
			$this->dayOfMonth = $dayOfMonth;
			$this->dayOccurrenceInMonth = $dayOccurrenceInMonth;
			$this->year = $year;
			$this->thisMonth = $thisMonth;
			$this->endsNever = $endsNever;
			$this->endsAfter = $endsAfter;
			$this->endsAfterOccurrences = $endsAfterOccurrences;
			$this->endsBy = $endsBy;
			$this->endsByTime = $endsByTime;
		}

		public function getAllDay() {
			return $this->allDay;
		}
		public function getDay() {
			return $this->day;
		}
		public function getWeek() {
			return $this->week;
		}
		public function addDayOfWeek($dayofweek, $startTime, $endTime) {
			$this->dayOfWeek[] = array($dayofweek, $startTime, $endTime);
		}
		public function getDaysOfWeek() {
			return json_encode($this->dayOfWeek);
		}
		public function getMonth() {
			return $this->month;
		}
		public function getDayOfMonth() {
			return $this->dayOfMonth;
		}
		public function getDayOccurrenceinMonth() {
			return $this->dayOccurrenceInMonth;
		}
		public function getYear() {
			return $this->year;
		}
		public function getThisMonth() {
			return $this->thisMonth;
		}
		public function getEndsVal() {
			if ($this->endsAfter) {
				return "after";
			}
			else if ($this->endsByTime) {
				return "by";
			}
			else { 
				return null; //Never ends
			}
		}
		public function getEndsAfterOccurrences() {
			return $this->endsAfterOccurrences; //Int
		}
		public function getEndsByTime() {
			return $this->endsByTime; //UNIX time
		}
		public function getSummary() {
			$invalidinputmessage = "Invalid recurring information entered.";
		
			$repeatsSummaryText = ""; //Return this string representation of the RecursObj
		
			if ($this->day!==""&&$this->day!=="*") { //Daily
				//Every value
				if ($this->day==1) { //Occurs every day
					$repeatsSummaryText .= "Daily";
				}
				else { //Occurs every x days
					$repeatsSummaryText .= "Every ".$this->day." day".($this->day>1 ? "s" : "");
				}
			}
			else if ($this->week!==""&&$this->week!=="*") { //Weekly
				if ($this->week==1) { //Occurs every week
					$repeatsSummaryText .= "Weekly on ";
				}
				else { //Occurs every x weeks
					$repeatsSummaryText .= "Every ".$this->week." weeks on ";
				}

				//Each day and time
				for ($i = 0; $i<count($this->dayOfWeek); $i++) {
					if ($i==0) { //First element in array, no comma before
					}
					else {
						$repeatsSummaryText .= ", "; //Element in array before this day, put a comma to separate them
					}
					$repeatsSummaryText .= $this->days[$this->dayOfWeek[$i][0]]; //Convert 0->Sunday, 1->Monday, etc.
					if (!$this->allDay) {
						$repeatsSummaryText .= " (".unixtodate($this->dayOfWeek[$i][1], "hours")."-".unixtodate($this->dayOfWeek[$i][2], "hours").")"; //Convert UNIX -> 4:00am, UNIX -> 5:00pm, then those times to "(4:00am-5:00pm)"
					}
				}
			}
			else if ($this->month!==""&&$this->month!=="*") { //Monthly
				if ($this->month==1) { //Occurs every month
					$repeatsSummaryText .= "Monthly on ";
				}
				else { //Occurs every x months
					$repeatsSummaryText .= "Every ".$this->month." months on ";
				}

				//Day # of Month
				if ($this->dayOfMonth!==""&&$this->dayOfMonth!=="*") {
					$repeatsSummaryText .= "the ".$this->dayOfMonth.numberSuffix($this->dayOfMonth)." day";
				}
				//Day Occurrence in Month
				else if ($this->dayOccurrenceInMonth!==""&&$this->dayOccurrenceInMonth!=="*") {
					$Nth = intval($this->dayOccurrenceInMonth)===1 ? "first" : (intval($this->dayOccurrenceInMonth)===2 ? "second" : (intval($this->dayOccurrenceInMonth)===3 ? "third" : (intval($this->dayOccurrenceInMonth)===4 ? "fourth" : (intval($this->dayOccurrenceInMonth)===5 ? "last" : "last"))));
					$repeatsSummaryText .= "the ".$Nth." ".$this->days[$this->dayOfWeek[0][0]]; //Convert Day of Week (0,1,2,3,4,5,6) to text, e.g. 0 => Sunday, 1 => Monday, etc.
				}
				else {
					return $invalidinputmessage;
				}
			}
			else if ($this->year!==""&&$this->year!=="*") { //Yearly
				if ($this->year==1) { //Occurs every year
					$repeatsSummaryText .= "Annually on ";
				}
				else { //Occurs every x years
					$repeatsSummaryText .= "Every ".$this->year." years on ";
				}

				//Day # of Month
				if ($this->dayOfMonth!==""&&$this->dayOfMonth!=="*") {
					$repeatsSummaryText .= "the ".$this->dayOfMonth.numberSuffix($this->dayOfMonth)." day";
				}
				//Day Occurrence in Month
				else if ($this->dayOccurrenceInMonth!==""&&$this->dayOccurrenceInMonth!=="*") {
					$Nth = intval($this->dayOccurrenceInMonth)===1 ? "first" : (intval($this->dayOccurrenceInMonth)===2 ? "second" : (intval($this->dayOccurrenceInMonth)===3 ? "third" : (intval($this->dayOccurrenceInMonth)===4 ? "fourth" : (intval($this->dayOccurrenceInMonth)===5 ? "last" : "last"))));
					$repeatsSummaryText .= "the ".$Nth." ".$this->days[$this->dayOfWeek[0][0]]; //Convert Day of Week (0,1,2,3,4,5,6) to text, e.g. 0 => Sunday, 1 => Monday, etc.
				}
				else {
					return $invalidinputmessage;
				}
				
				//This Month
				$repeatsSummaryText .= " of ".$this->months[$this->thisMonth];
			}
			else {
				return $invalidinputmessage;
			}
			//Ends value
			if ($this->endsNever) { //Ends After _ occurrences
				$repeatsSummaryText .= "";
			}
			else if ($this->endsAfter) {
				$repeatsSummaryText .= ", stop after ".$this->endsAfterOccurrences." times";
			}
			else if ($this->endsBy) {
				$repeatsSummaryText .= ", until ".unixtodate($this->endsByTime, 'n/j/Y'); //Convert UNIX -> MM/DD/YYYY
			}
			else {
				return $invalidinputmessage;
			}

			return $repeatsSummaryText;
		}
		
		public function reset() {
			$this->eventBlockStart = 0; //Int - UNIX start time for this event block (e.g. Sunday 21, 2013 4:00pm)
			$this->eventBlockEnd = 0; //Int - UNIX end time for this event block (e.g. Sunday 21, 2013 7:00pm); this block itself is what gets repeated to create the overarching "Event"
			$this->allDay = false; //Boolean - Whether this event is all day or not

			$this->day = "*"; //String - This event repeats every _ days
			$this->week = "*"; //String - This event repeats every _ weeks
			$this->dayOfWeek = array(); //2-D Array - This event repeats every [0][0], for Sunday, Monday, etc. [0][1] for starttime, UNIX [0][2] for endtime, UNIX
			$this->month = "*"; //String - This event repeats every _ months
			$this->dayOfMonth = "*"; //String - This event repeats every _ days
			$this->dayOccurrenceInMonth = "*"; //Int - 1-5, will be placed after # is the 1st, 2nd, 3rd, 4th, last per month ; 
			$this->year = "*"; //String - This event repeats every _ years
			$this->thisMonth = "*"; //String - This event repeats every _ month of the year

			$this->endsNever = true; //Boolean - Recurring event never ends
			$this->endsAfter = false; //Boolean - Recurring event ends after x occurrences
			$this->endsAfterOccurrences = 0; //Int - Event ends after _ occurrences
			$this->endsBy = false; //Boolean - Recurring event ends by some date
			$this->endsByTime = 0; //Int UNIX time for the end of the day that this event stops recurring on
		}
	}

	class Paginator {  
		var $items_per_page;  
		var $items_total;  
		var $current_page = 1;  
		var $num_pages;  
		var $mid_range; //This times 2 is the number of page-btns to display
		var $low;  
		var $high;  
		var $limit;  
		var $return;  
		var $default_ipp = 10;  
  		var $startofid_attr; //Start of id attribute, e.g. "".$this->startofid_attr."-page-1" or "".$this->startofid_attr."-page-2" the "eventslist" part
  		
  		//Current page, total query results, range of page numbers, results per page, start of id attribute value
  		
		function __construct($currentpage, $itemstotal, $midrange, $itemsperpage, $startofid_attr) {
			if ($currentpage<1 Or !is_numeric($currentpage)) {
				$this->current_page = 1;  
			}
			else {
				$this->current_page = (int) $currentpage; // must be numeric > 0 $_GET['page']
			}
			$this->items_total = (int) $itemstotal;
			$this->mid_range = (int) $midrange;
			$this->items_per_page = $itemsperpage; //$_GET['ipp']
			$this->startofid_attr = $startofid_attr;
			//Change current_page to 'All' if items_per_page is 'All'
			if ($itemsperpage == 'All') {
				$this->current_page = 'All';
			}
  		}
  
		function paginate() {
			if ($this->items_total>0) { //There were more than 0 results
				if ($this->items_per_page == 'All') {  
					$this->num_pages = ceil($this->items_total/$this->default_ipp);
					//$this->items_per_page = $this->default_ipp;  <-- Taking this out fixes the bug when $_GET['ipp'] is 'All' and <select> menu defaults to '10' instead of 'All'
				}  
				else {
					//If the $_GET['ipp'] isn't 'All', isn't a number, or is a number and is less than 0, make ipp the default
					if (!is_numeric($this->items_per_page) OR $this->items_per_page <= 0) $this->items_per_page = $this->default_ipp; //Make ipp the default (10) because an invalid one was provided by $_GET['ipp']
					$this->num_pages = ceil($this->items_total/$this->items_per_page); //Number of pages needed to display data = number of posts / posts per page
					//Ceil() returns the next highest integer by rounding up if necessary
				}

				if ($this->current_page > $this->num_pages) $this->current_page = $this->num_pages;  
				$prev_page = $this->current_page-1;  
				$next_page = $this->current_page+1;  

				if ($this->num_pages > 10) {  
					$this->return = ($this->current_page != 1 And $this->items_total >= 10) ? "<button id=\"".$this->startofid_attr."-paginate-".($this->current_page-1)."\" class=\"btn secondary paginate-btn\">« Previous</button> " : "<button class=\"btn secondary paginate-btn\" disabled>« Previous</button> "; 

					$this->start_range = $this->current_page - floor($this->mid_range/2);  
					$this->end_range = $this->current_page + floor($this->mid_range/2);  

					if ($this->start_range <= 0) {  
						$this->end_range += abs($this->start_range)+1;  
						$this->start_range = 1;  
					}  
					if ($this->end_range > $this->num_pages) {  
						$this->start_range -= $this->end_range-$this->num_pages;  
						$this->end_range = $this->num_pages;  
					}  
					$this->range = range($this->start_range,$this->end_range);  

					for ($i=1;$i<=$this->num_pages;$i++) {  
						if ($this->range[0] > 2 And $i == $this->range[0]) $this->return .= " ... ";  
						// loop through all pages. if first, last, or in range, display  
						if ($i==1 Or $i==$this->num_pages Or in_array($i,$this->range)) {  
							$this->return .= ($i == $this->current_page And $this->current_page != 'All') ? "<button id=\"".$this->startofid_attr."-paginate-$i\" class=\"btn secondary paginate-btn current\" title=\"Go to page $i of $this->num_pages\">$i</button> ": "<button id=\"".$this->startofid_attr."-paginate-$i\" class=\"btn secondary paginate-btn\" title=\"Go to page $i of $this->num_pages\">$i</button> ";
						}  
						if ($this->range[$this->mid_range-1] < $this->num_pages-1 And $i == $this->range[$this->mid_range-1]) $this->return .= " ... ";  
					}  
					$this->return .= (($this->current_page != $this->num_pages And $this->items_total >= 10) And ($this->current_page != 'All')) ? "<button id=\"".$this->startofid_attr."-paginate-".($this->current_page+1)."\" class=\"btn secondary paginate-btn\">Next »</button> \n" : "<button class=\"btn secondary paginate-btn\" disabled>Next »</button> ";  
					$this->return .= ($this->items_per_page == 'All') ? "<button id=\"".$this->startofid_attr."-paginate-all\" class=\"btn secondary paginate-btn current\" style=\"margin-left:10px\">All</button> \n" : "<button id=\"".$this->startofid_attr."-paginate-all\" class=\"btn secondary paginate-btn\" style=\"margin-left:10px\">All</button> \n";  
					// ^^^^ Changed "$this->return .= ($this->current_page == 'All') " to "$this->return .= ($this->items_per_page == 'All') "
				}  
				else {  
					for ($i=1;$i<=$this->num_pages;$i++) {  
						$this->return .= ($i == $this->current_page) ? "<button id=\"".$this->startofid_attr."-paginate-$i\" class=\"btn secondary paginate-btn current\">$i</button> " : "<button id=\"".$this->startofid_attr."-paginate-$i\" class=\"btn secondary paginate-btn\">$i</button> ";  
					}  
					$this->return .= ($this->items_per_page == 'All') ? "<button id=\"".$this->startofid_attr."-paginate-all\" class=\"btn secondary paginate-btn current\">All</button> \n" : "<button id=\"".$this->startofid_attr."-paginate-all\" class=\"btn secondary paginate-btn\">All</button> \n";  
				}  

				$this->low = ($this->current_page-1) * $this->items_per_page;  
				$this->high = ($this->items_per_page == 'All') ? $this->items_total:($this->current_page * $this->items_per_page)-1;  
				$this->limit = ($this->items_per_page == 'All') ? "":" LIMIT $this->low,$this->items_per_page";
			}
			else {
				$this->return = "";
				$this->limit = " LIMIT 0";
			}
		}  
  
		function display_items_per_page() {
			if ($this->items_total>0) { //There were more than 0 results
				$items = '';  
				$ipp_array = array(5,8,10,15,20);
				foreach ($ipp_array as $ipp_opt) {
					$items .= ($ipp_opt == $this->items_per_page) ? "<option selected value=\"$ipp_opt\">$ipp_opt</option>\n":"<option value=\"$ipp_opt\">$ipp_opt</option>\n";  
				}
				return "<span class=\"\">Items per page:</span><select class=\"paginate-select\" >$items</select>\n";  
			}
		}  
  
		function display_jump_menu() {
			$option = "";
			if ($this->items_total>0) { //There were more than 0 results
				for ($i=1;$i<=$this->num_pages;$i++) {  
					$option .= ($i==$this->current_page) ? "<option value=\"$i\" selected>$i</option>\n":"<option value=\"$i\">$i</option>\n";  
				}  
				return "<span class=\"\">Page:</span><select id=\"".$this->startofid_attr."-paginate-select\" class=\"paginate-select\" >$option</select>\n";  
			}
		}  
  
		function display_pages() {
			if ($this->items_total>0) { //There were more than 0 results
				return $this->return;
			}
		}  
	}  
?>