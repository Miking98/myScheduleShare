<?php
	

	/*

	NOTE: 	The authentication handling functions have been removed,
			as well as many of the longer utiliy functions, e.g. removeeventfromseries(), 

	*/
			
	require_once("secureclasses.php");

	include_once "carbon.php";
	use Carbon\Carbon;

	//Facebook App data
	$fbAppID = 'secret';
	$fbAppSecret = 'secret';

	date_default_timezone_set('UTC');

	//SECURE SESSION START FUNCTION
	function sec_session_start() {
		//SECRET
	}


	//PREVENT ASYNCHRONOUS REQUESTS SECURE SESSION START FUNCTION
	function prevent_asynch_sec_session_start() {
		//SECRET
	}


	//SECURE LOGIN FUNCTION
	function login($email, $password, $mysqli) {
		//SECRET
	}

	//SECURE LOGIN THROUGH FACEBOOK
	//Note - this assumes that the facebookID has been verified
	function fbLogin($facebookID, $facebookAccessToken, $mysqli) {
		//SECRET
	}

	//CREATE LOGIN CHECK FUNCTION - BRUTE FORCE
	function checkbrute($user_id, $mysqli) {
		//SECRET
	}


	//CREATE LOGIN CHECK FUNCTION - Logged Status
	function login_check($mysqli) {
		//SECRET
	}


	//CHECK AUTHCOOKIE
	function authtoken_check($mysqli, $raw_authtoken) {
		//SECRET
	}



	//ADD EVENT TO USER'S SCHEDULE
	function addtoschedule($mysqli, $users, $eventid, $schoolid) { //Parameters: $mysqli, ID-Name Objects users, (int) $eventid, (int) $schoolid
		
		$eventid = (int) $eventid;
		$schoolid = (int) $schoolid;

		if (!is_array($users)) {
			//If Single user Object was passed to addtoschedule() function, change $users -> array() of $users
			$users = array($users);
		}

		//For each user, check if he can SEE this event
		$sqlquery = "SELECT COUNT(*)
						FROM se
						LEFT JOIN in ON in.in_eventid=se.se_id
						WHERE se.se_id=? 
						AND (in.in_userid=? OR ISNULL(in.in_userid))".
						getSQLforCurrentUserCanSeeThisEvent("?", $schoolid);

		if ($stmt = $mysqli->prepare($sqlquery)) { //Visible to this user ID
			for ($i = 0; $i<count($users); $i++) {
				$userid = (int) $users[$i]->getid();
				$stmt->bind_param('iiii', $eventid, $userid, $userid, $userid);
				$stmt->execute();
				$stmt->store_result();
				$stmt->bind_result($userCanAddThisEvent);
				$stmt->fetch();

				//Filter out users that can't add this event to their schedules
				if ($userCanAddThisEvent===1) { //User CAN add this event to his schedule - it is visible to him
				}
				else {
					$users[$i]->setid(0); //User CANNOT add event to his schedule
				}
			}

			//Users Array has been safely filtered based on event visibility

			//Accept any invites if this event is private
			if ($stmt = $mysqli->prepare("UPDATE in SET in_accepted=1 WHERE in_userid=? AND in_eventid=? LIMIT 1")) {
				for ($i = 0; $i<count($users); $i++) {
					$userid = (int) $users[$i]->getid();
					if ($userid===0) { //This user can't add this event to his schedule, OR Invalid user ID
						continue;
					}

					$stmt->bind_param('ii',$userid, $eventid);
					$stmt->execute();
				}

				//Now add event to user's schedules
				if ($stmt = $mysqli->prepare("INSERT INTO s (s_userid, s_eventid, s_color) VALUES (?,?,?)")) {
					for ($i = 0; $i<count($users); $i++) {
						$userid = (int) $users[$i]->getid();
						if ($userid===0) { //This user can't add this event to his schedule, OR Invalid user ID
							continue;
						}

						$extrainfo = $users[$i]->getinfo();
						//[0] -> Color
						$color = (!is_null($extrainfo[0])&&count($extrainfo)>0 ? $extrainfo[0] : "");
						$stmt->bind_param('iis', $userid, $eventid, $color);
						$stmt->execute();
					}
					return true;
				}
				else {
					return false;
				}
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
	}


	//REMOVE EVENT FROM SCHEDULE
	function removeeventfromschedule($mysqli, $users, $eventid) {

		$eventid = (int) $eventid;

		if (!is_array($users)) {
			//If Single user Object was passed to addtoschedule() function, change $users -> array() of $users
			$users = array($users);
		}

		//Remove event from users' schedules
		if ($stmt = $mysqli->prepare("DELETE FROM s WHERE s_eventid=? AND s_userid=? LIMIT 1")) {
			for ($i = 0; $i<count($users); $i++) {
				$userid = $users[$i]->getid();
				$stmt->bind_param('ii',$eventid, $userid);
				$stmt->execute();
			}
			//Decline invitations
			if ($stmt = $mysqli->prepare("UPDATE in SET in_accepted=-1 WHERE in_eventid=? AND in_userid=? AND (in_accepted=1 OR in_accepted=0) LIMIT 1")) { //Add accepted=1 or accepted=0 so we don't undo permanently deleted events
				for ($i = 0; $i<count($users); $i++) {
					$userid = $users[$i]->getid();
					$stmt->bind_param('ii',$eventid, $userid);
					$stmt->execute();
				}
				//Remove event from this user's HW log
				if ($stmt = $mysqli->prepare("DELETE FROM hw WHERE hw_eventid=? AND hw_userid=? LIMIT 1")) { //Delete any rows in HW log where eventid and userid are this
					for ($i = 0; $i<count($users); $i++) {
						$userid = $users[$i]->getid();
						$stmt->bind_param('ii',$eventid, $userid);
						$stmt->execute();
					}
					return true; //Successful
				}
				else {
					return false;
				}
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
	}


	//ADD EVENT SERIES AND IT'S EVENTS TO USER'S SCHEDULE
	function addeventseriestoschedule($mysqli, $users, $seriesid, $schoolid) { //Parameters: $mysqli, ID-Name Objects users, (int) $seriesid
		
		$seriesid = (int) $seriesid;
		$schoolid = (int) $schoolid;

		if (!is_array($users)) {
			//If Single user Object was passed to addeventseriestoschedule() function, change $users -> array() of $users
			$users = array($users);
		}

		//For each user, check if he can SEE this series
		$sqlquery = "SELECT COUNT(*)
						FROM es
						LEFT JOIN in_es ON in_es.in_es_seriesid=es.es_id
						WHERE es.es_id=? 
						AND (in_es.in_es_userid=? OR ISNULL(in_es.in_es_userid))".
						getSQLforCurrentUserCanSeeThisEventSeries("?", $schoolid);

		if ($stmt = $mysqli->prepare($sqlquery)) { //Visible to this user ID
			for ($i = 0; $i<count($users); $i++) {
				$userid = (int) $users[$i]->getid();
				$stmt->bind_param('iiii', $seriesid, $userid, $userid, $userid);
				$stmt->execute();
				$stmt->store_result();
				$stmt->bind_result($userCanAddThisSeries);
				$stmt->fetch();

				//Filter out users that can't add this series to their schedules
				if ($userCanAddThisSeries===1) { //User CAN add this series to his schedule - it is visible to him
				}
				else {
					$users[$i]->setid(0); //User CANNOT add series to his schedule
				}
			}

			//Users Array has been safely filtered based on series visibility

			//Accept any invites if this series is private
			if ($stmt = $mysqli->prepare("UPDATE in_es SET in_es_accepted=1 WHERE in_es_userid=? AND in_es_seriesid=? LIMIT 1")) {
				for ($i = 0; $i<count($users); $i++) {
					$userid = (int) $users[$i]->getid();
					if ($userid===0) { //This user can't add this series to his schedule, OR Invalid user ID
						continue;
					}

					$stmt->bind_param('ii', $userid, $seriesid);
					$stmt->execute();
				}

				//Now add series to user's schedules
				if ($stmt = $mysqli->prepare("INSERT INTO s_es (s_es_userid, s_es_seriesid, s_es_color) VALUES (?,?,?)")) {
					for ($i = 0; $i<count($users); $i++) {
						$userid = (int) $users[$i]->getid();
						if ($userid===0) { //This user can't add this series to his schedule, OR Invalid user ID
							continue;
						}

						$extrainfo = $users[$i]->getinfo();
						//[0] -> Color
						$color = (!is_null($extrainfo[0])&&count($extrainfo)>0 ? $extrainfo[0] : "");
						$stmt->bind_param('iis', $userid, $seriesid, $color);
						$stmt->execute();
					}

					//Now add events FROM es to these persons' schedules
					if ($stmt = $mysqli->prepare("INSERT IGNORE INTO s (s_userid, s_eventid) 
												SELECT ?, se.se_id FROM es_events LEFT JOIN se ON es_events.es_events_eventid=se.se_id WHERE es_events.es_events_seriesid=?")) {
						for ($i = 0; $i<count($users); $i++) {
							$userid = (int) $users[$i]->getid();
							if ($userid===0) { //This user can't add this series to his schedule, OR Invalid user ID
								continue;
							}
							$stmt->bind_param('ii', $userid, $seriesid);
							$stmt->execute();
						}
						return true; //Successful
					}
					else {
						return false;
					}
				}
				else {
					return false;
				}
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
	}


	//ADD EVENTS TO EVENT SERIES (MANY TO MANY)
	//Assume that Series and Events belong to same school
	function addeventstoeventseries($mysqli, $series, $events) { //Parameters: $mysqli, array of series IDs, array of event IDs
		for ($i = 0; $i<count($series); $i++) {
			$seriesid = (int) $series[$i];
			if ($stmt = $mysqli->prepare("INSERT INTO es_events (es_events_seriesid, es_events_eventid) VALUES (?,?)")) {
				for ($g = 0; $g<count($events); $g++) {
					$eventid = (int) $events[$g];
					$stmt->bind_param('ii', $seriesid, $eventid);
					$stmt->execute();
				}
			}
			else {
				return false;
			}
		}
		return true;
	}


	


	//GET SCHEDULE EVENTS WITHIN STARTTIME-ENDTIME
	function returnScheduleEvents($mysqli, $starttime, $endtime, $userIDs, $currentUserID, $schoolid, $oneOfEachSharedEvent = false, $includeCurrentUserInSharedWith = false, $tagIDs = array(), $seriesIDs = array()) {
		if (isset($starttime, $endtime, $userIDs, $currentUserID, $schoolid)) {
			//Starttime - UNIX int for start of interval
			//Endtime - UNIX int for start of interval
			//User IDs - array of user ID's to fetch schedules of, if multiple users
			//Current User ID - current user's ID (From $_SESSION variable)
			//School ID - current user's school ID
			//oneOfEachSharedEvent - Boolean - If true, only return one version of a shared scheduleevent, rather than 100's of JSON strings for the same event if 100's of people share that event
			//Tag IDs - array of tag ID's that event must have one of to be returned - OR if no tag IDs are specified, all events are OK
			//Series IDs - array of event series ID's that event must be a part of to be returne d- OR if no series IDs are specified, all events are OK

			$starttime = (int) $starttime;
			$endtime = (int) $endtime;
			$schoolid = (int) $schoolid;
			$currentUserID = ((int) $currentUserID!=0 ? (int) $currentUserID : $_SESSION['user_id']);
			$oneOfEachSharedEvent = (boolean) $oneOfEachSharedEvent;

			//Filter Tag IDs and Series IDs
			//Tags
			$valid_tagids = array();
			for ($i = 0; $i<count($tagIDs); $i++) {
				$pushID = (int) $tagIDs[$i];
				if ($pushID!=0) { //Valid, filtered ID
					$valid_tagids[] = $pushID;
				}
			}
			$tagstofilter = false;
			if (count($valid_tagids)>0) {
				$filtered_tagids = implode(",", $valid_tagids);
				$tagstofilter = true;
			}
			//Event Series
			$valid_seriesids = array();
			for ($i = 0; $i<count($seriesIDs); $i++) {
				$pushID = (int) $seriesIDs[$i];
				if ($pushID!=0) { //Valid, filtered ID
					$valid_seriesids[] = $pushID;
				}
			}
			$seriestofilter = false;
			if (count($valid_seriesids)>0) {
				$filtered_seriesids = implode(",", $valid_seriesids);
				$seriestofilter = true;
			}


			$oneuser = false;
			$multipleusers = false;
			$notCurrentUser = true;

			if (count($userIDs)==0) { //No User IDs input, ERROR
				return null;
			}
			else if (count($userIDs)==1) { //Only one user ID, might be this person getting his own schedule
				$oneuser = true;
				$notCurrentUser = (!$userIDs[0]==$currentUserID);
			}
			else { //Multiple user's schedules are being returned
				$multipleusers = true;
			}
			

			//Array to hold Schedule Event objs
			$events = array(); //Array to hold event objects - WILL BE RETURNED AS JSON STRING

			//Keep track of event IDs already added and which user IDs they belong to
			$eventIDsAlreadyAdded = array(); //Associative array, [i] -> i is event ID, Actual array contents -> user ID who this event belongs to

			if ($endtime-$starttime>60*60*24*7+1) { //Interval is longer than a week
				$monthview = true;
				$weekview = false;
			}
			else {
				$monthview = false;
				$weekview = true;
			}

			$zerotime = Carbon::createFromTimeStampUTC(0);
			$zerotimeForWeeks = Carbon::createFromTimeStampUTC(-345600); //Remember - UNIX epoch time starts on a Thursday, so subtract 4 days from 0 to get to Sunday as the start of the week
			$origstarttimeDiffInDays = Carbon::createFromTimeStampUTC($starttime)->diffInDays($zerotime);
			$origstarttimeDiffInWeeks = Carbon::createFromTimeStampUTC($starttime)->diffInWeeks($zerotimeForWeeks);
			$origstarttimeDiffInMonths = Carbon::createFromTimeStampUTC($starttime)->diffInMonths($zerotime); //Starttime plus one week (b/c start and end of month might not be in that month b/c of week padding)
			$origstarttimeDiffInYears = Carbon::createFromTimeStampUTC($starttime)->diffInYears($zerotime);
			$origstarttimeDayOfMonth = ($monthview ? 1 : date('j', $starttime)); //1-31

			$origendtimeDiffInDays = Carbon::createFromTimeStampUTC($endtime)->diffInDays($zerotime);
			$origendtimeDiffInWeeks = Carbon::createFromTimeStampUTC($endtime)->diffInWeeks($zerotimeForWeeks);
			$origendtimeDiffInMonths = Carbon::createFromTimeStampUTC($endtime)->diffInMonths($zerotime); //Endtime minus one week (b/c start and end of month might not be in that month b/c of week padding)
			$origendtimeDiffInYears = Carbon::createFromTimeStampUTC($endtime)->diffInYears($zerotime);
			$origendtimeDayOfMonth = ($monthview ? date('t', strtotime(date('c', 0)." +".$origstarttimeDiffInMonths."months") ) : date('j', $starttime)); //1-31

			$sqlquery = "SELECT s.s_userid, s.s_color, s.s_hw, 
											se.se_id, se.se_createdby, se.se_schoolid, se.se_meeting, se.se_name, se.se_teacher, se.se_description, 
											se.se_starttime, se.se_endtime, se.se_allday, se.se_recur, se.se_visibility, 
											se.se_color,
											et.et_id, et.et_name, et.et_color, et.et_colorevents, 
											m.m_id, m.m_fname, m.m_lname, m.m_tom, m.m_grade, m.m_school, 
											se_meta.se_meta_eventid, se_meta.se_meta_interval, se_meta.se_meta_starttime, se_meta.se_meta_endtime, se_meta.se_meta_day, se_meta.se_meta_week, se_meta.se_meta_dayofweek, se_meta.se_meta_month, se_meta.se_meta_dayofmonth, se_meta.se_meta_dayoccurrenceinmonth, se_meta.se_meta_thismonth, se_meta.se_meta_year, se_meta.se_meta_endsafter, se_meta.se_meta_endsby, 
											(SELECT CONCAT(m.m_fname, ' ', m.m_lname) FROM m WHERE m.m_id=se.se_createdby LIMIT 1) as 'createdbyname',
											(SELECT CONCAT(m.m_fname, ' ', m.m_lname) FROM m WHERE m.m_id=se.se_teacher LIMIT 1) as 'teachername', 
											(SELECT schedules2.s_color FROM s AS schedules2 WHERE schedules2.s_userid=".$currentUserID." AND schedules2.s_eventid=se.se_id) as 'currentusereventcolor', ". //If current user is getting a friend's schedule, color code events that the friend shares with the current user in the same color that the current user uses for that event
											"(SELECT schedules3.s_hw FROM s AS schedules3 WHERE schedules3.s_userid=".$currentUserID." AND schedules3.s_eventid=se.se_id) as 'currentusereventhw', ". //Personalize homework
											"(SELECT schedules4.s_description FROM s AS schedules4 WHERE schedules4.s_userid=".$currentUserID." AND schedules4.s_eventid=se.se_id) as 'currentusereventdescrip', ". //Peronsonalize description
											"in.in_accepted, in.in_perms_inviteothers, in.in_perms_seeothers, in.in_perms_modify ".
											"FROM s 
											LEFT JOIN se ON s.s_eventid=se.se_id
											LEFT JOIN m ON s.s_userid=m.m_id 
											LEFT JOIN et ON s.s_eventtag=et.et_id AND et.et_userid=".$currentUserID."
											LEFT JOIN in ON s.s_eventid=in.in_eventid AND in.in_userid=".$currentUserID."
									 		LEFT JOIN se_meta ON se_meta.se_meta_eventid=se.se_id 
											WHERE s.s_userid=? ".
											($tagstofilter ? "AND s.s_eventtag IN (".$filtered_tagids.") " : ""). //If no tags, then accept all tags, so no need to limit query with WHERE clause : Else, there are tags to filter by, so filter with those
											($seriestofilter ? " AND (SELECT COUNT(*) FROM es_events WHERE es_events.es_events_eventid=se.se_id AND es_events.es_events_seriesid IN (".$filtered_seriesids."))>0 " : ""). //Event belongs to an Event Series with an acceptable series ID
											getSQLforCurrentUserCanSeeThisEvent($currentUserID, $schoolid).//True if Current User can see this event
											"AND (".
												//Non-recurring event
												"(se.se_starttime>=".$starttime." AND se.se_endtime<=".$endtime.") ".
												//Recurring event
												"OR se.se_recur=1".
											")".
											" ORDER BY se.se_id";
			if ($stmt = $mysqli->prepare($sqlquery)) {
				for ($i = 0; $i<count($userIDs); $i++) {
					$userid = (int) $userIDs[$i];
					$stmt->bind_param('i',$userid);
					$stmt->execute();
					$stmt->store_result();
					$rowdata = array(); //Create array to hold all data in returned row
					stmt_bind_assoc($stmt, $rowdata); //Get all values in row
					$resultQuery = array(); //Hold all $rowdata rows

					while ($stmt->fetch()) { //Store all events data

						$eventIDkey = "".$rowdata['se_id']; //For $eventIDsAlreadyAdded array

						//First, check if we only want one version of each event
						if ($oneOfEachSharedEvent) {
							//Yes, we only want one version of each event
							//Now check if this event has already been added by someone else
							if (isset($eventIDsAlreadyAdded[$eventIDkey])||array_key_exists($eventIDkey, $eventIDsAlreadyAdded)) {
								//If event with this ID has already been added
								//And this Event doesn't belong to that same user (for repeated events)
								if ($eventIDsAlreadyAdded[$eventIDkey]!=$userid) {
									continue; //Don't add same event from different users twice
								}
							}
						}


						//Modify $rowdata to fit returnScheduleEvents() SQL Query
						//Belongs To information
						$rowdata['belongstoname'] = $rowdata['m_fname']." ".$rowdata['m_lname'];
						$rowdata['belongstotom'] = $rowdata['m_tom'];
						$rowdata['belongstoschool'] = $rowdata['m_school'];
						$rowdata['belongstograde'] = $rowdata['m_grade'];
						//Created By Information
						$rowdata['createdbytom'] = 0;
						$rowdata['createdbyschool'] = $schoolid;
						$rowdata['createdbygrade'] = 0;
						//Homework
						$rowdata['s_hw'] = ($rowdata['currentusereventhw']!="" ? $rowdata['currentusereventhw'] : $rowdata['se_hw']); //Homework for event
						//Color
						$rowdata['s_color'] = (isvalidcolor($rowdata['currentusereventcolor']) ? $rowdata['currentusereventcolor'] : $rowdata['se_color']); //Default, fallback to original color creator of event specified
						//Description
						$rowdata['s_description'] = ($rowdata['currentusereventdescrip']!="" ? $rowdata['currentusereventdescrip'] : $rowdata['se_descrip']); //Description for event
			

						if ($rowdata['se_recur']==1) { //This event recurs - perform some more checks
							$dynamicGeneratedEvents = array(); //IF event is Recurring - Array to hold UNIX start and end times of recurring event in this interval
							$dynamicGeneratedEvents = recurringEventsStartEndCalc($starttime, $endtime, $rowdata['se_starttime'], $rowdata['se_endtime'], $rowdata['se_meta_starttime'], $rowdata['se_meta_endtime'], $rowdata['se_meta_day'], $rowdata['se_meta_week'], $rowdata['se_meta_dayofweek'], $rowdata['se_meta_month'], $rowdata['se_meta_dayofmonth'], $rowdata['se_meta_dayoccurrenceinmonth'], $rowdata['se_meta_year'], $origstarttimeDiffInDays, $origstarttimeDiffInWeeks, $origstarttimeDiffInMonths, $origstarttimeDayOfMonth, $origstarttimeDiffInYears, $origendtimeDiffInDays, $origendtimeDiffInWeeks, $origendtimeDiffInMonths, $origendtimeDayOfMonth, $origendtimeDiffInYears, $zerotime, $zerotimeForWeeks, $rowdata['se_meta_endsafter'], $rowdata['se_meta_endsby']);

							if (is_null($dynamicGeneratedEvents)) { //Null returned - this recurring event doesn't repeat in this interval
								continue;
							}
							else {
								for ($g = 0; $g<count($dynamicGeneratedEvents); $g++) {
									//Dynamically generated UNIX start-end for recurring events
									$rowdata['se_starttime'] = $dynamicGeneratedEvents[$g][0];
									$rowdata['se_endtime'] = $dynamicGeneratedEvents[$g][1];
									copyRowdataToArray($resultQuery[], $rowdata);
								}
							}
						}
						else { //Regular, one-time event 
							copyRowdataToArray($resultQuery[], $rowdata);
						}

						//Record that an event with this ID that belongs to this user ID has been added
						$eventIDsAlreadyAdded[$eventIDkey] = $userid;
					}
				}

				$events = convertQueryToScheduleEventObjects($resultQuery);

				//Get shared with persons
				$events = getSharedWithPersons($mysqli, $events, $schoolid, $currentUserID, $includeCurrentUserInSharedWith);

				//Get event series
				$events = getEventSeriesInformation($mysqli, $events, $schoolid, $currentUserID);

				return $events;
			}
			else {
				return "dbfailure";
			}
		}
		else {
			return "invalidvars";
		}
	}



	//RETURN_SCHEDULEEVENTS FUNCTIONS TO CHECK IF RECURRING EVENT REPEATS IN THE STARTTIME-ENDTIME UNIX INTERVAL
	function recurringEventsStartEndCalc($requestedintervalUNIXstarttime, $requestedintervalUNIXendtime, $se_eventblock_starttime, $se_eventblock_endtime, $se_meta_starttime, $se_meta_endtime, $se_meta_day, $se_meta_week, $se_meta_dayofweek, $se_meta_month, $se_meta_dayofmonth, $se_meta_dayoccurrenceinmonth, $se_meta_year,
										$origstarttimeDiffInDays, $origstarttimeDiffInWeeks, $origstarttimeDiffInMonths, $origstarttimeDayOfMonth, $origstarttimeDiffInYears, $origendtimeDiffInDays, $origendtimeDiffInWeeks, $origendtimeDiffInMonths, $origendtimeDayOfMonth, $origendtimeDiffInYears, $zerotime, $zerotimeForWeeks, 
										$eventEndsAfterTime, $eventEndsByTime) {
		//$rowdata['se_meta_starttime'], $rowdata['se_meta_endtime'], $rowdata['se_meta_day'], $rowdata['se_meta_week'], $rowdata['se_meta_dayofweek'], $rowdata['se_meta_month'], $rowdata['se_meta_dayofmonth'], $rowdata['se_meta_dayoccurrenceinmonth'], $rowdata['se_meta_year'], 
		//Reset values we increment while checking the week/month intervals
		$monthNames = array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
		if (is_null($se_meta_starttime)||is_null($se_meta_endtime)||is_null($se_meta_day)||is_null($se_meta_week)||is_null($se_meta_dayofweek)||is_null($se_meta_month)||is_null($se_meta_dayofmonth)||is_null($se_meta_dayoccurrenceinmonth)||is_null($se_meta_year)) {
			return array(0,0);
		}
		
		$starttimeDiffInDays = $origstarttimeDiffInDays;
		$starttimeDiffInWeeks = $origstarttimeDiffInWeeks;
		$starttimeDiffInMonths = $origstarttimeDiffInMonths;
		$starttimeDiffInDayofMonth = $origstarttimeDayOfMonth;
		$starttimeDiffInYears = $origstarttimeDiffInYears;
		$endtimeDiffInDays = $origendtimeDiffInDays;
		$endtimeDiffInWeeks = $origendtimeDiffInWeeks;
		$endtimeDiffInMonths = $origendtimeDiffInMonths;
		$endtimeDiffInDayofMonth = $origendtimeDayOfMonth;
		$endtimeDiffInYears = $origendtimeDiffInYears;

		//UNIX start and end times
		$eventStart = ($se_meta_starttime!=null&&$se_meta_starttime!="*" ? $se_meta_starttime : $se_eventblock_starttime); //If there is not meta_starttime set (for weekly events), use the default starttime of this event (for daily, monthly, and yearly repeating events)
		$eventEnd = ($se_meta_endtime!=null&&$se_meta_endtime!="*" ? $se_meta_endtime : $se_eventblock_endtime); //If there is not meta_endtime set (for weekly events), use the default endtime of this event (for daily, monthly, and yearly repeating events)
		if ($eventEnd<=$eventStart) { $eventEnd = $eventStart+1; } //Make sure Event End is greater than Event Start

		//Recurring events dynamically calculated [0][0] -> starttime [0][1] -> endtime (UNIX timestamps)
		$dynamicGeneratedEvents = array();


		//Ends By and Ends After (true if it does)
		//EndsByTime is a UNIX date already
		//EndsAfterTime is a number for occurrences

		///// Daily /////
		$RecurDaysInterval = $se_meta_day; //This event repeats every _ days

		$eventStartDays = Carbon::createFromTimeStampUTC($eventStart)->diffInDays($zerotime); //Day # from UNIX timestamp that this event first starts
		$repeatsInThisDay = 0; //Check if valid
		
		if ($RecurDaysInterval!="*"&&$RecurDaysInterval!=null) { 
			//Every _ days
			while ($starttimeDiffInDays<=$endtimeDiffInDays) { //Yes <= because we want to check all days
				$testDay = checkIfRecurringEventRepeatsInThisRange($requestedintervalUNIXstarttime, $requestedintervalUNIXendtime, $starttimeDiffInDays, $starttimeDiffInDays, $eventStartDays, $eventStart, $eventEnd, $RecurDaysInterval, $eventEndsAfterTime, $eventEndsByTime, 'day');
				if ($testDay!=null) { //One day at a time

					$nextStartEndUNIX = nextUNIXOccurrenceAfterRequestedStartInterval($starttimeDiffInDays, $starttimeDiffInDays, $eventStartDays, $eventStart, $eventEnd, $RecurDaysInterval, 'day');
					$previousStartEndUNIX = previousUNIXOccurrenceBeforeRequestedStartInterval($starttimeDiffInDays, $starttimeDiffInDays, $eventStartDays, $eventStart, $eventEnd, $RecurDaysInterval, 'day');
					
					if ($testDay=="both") { //Both previous and next
						$dynamicGeneratedEvents[] = $nextStartEndUNIX;
						$dynamicGeneratedEvents[] = $previousStartEndUNIX;
					}
					else if ($testDay=="next") { //Just next
						$dynamicGeneratedEvents[] = $nextStartEndUNIX;
					}
					else { //Just previous
						$dynamicGeneratedEvents[] = $previousStartEndUNIX;
					}
					$repeatsInThisDay++; //Valid event
				}
				$starttimeDiffInDays++; //Set new range with which to look at the requested interval
				//End time stays the same - just slowly increment the start time so that the interval length decreases gradually
			}
			if ($repeatsInThisDay==0) { //Doesn't repeat in this day
				return null; //This event doesn't repeat in this month
			}
		}
		else {
			//Not daily event
		}


		///// Weekly /////
		$RecurWeeksInterval = $se_meta_week; //This 	event repeats every _ weeks
		$eventStartWeeks = Carbon::createFromTimeStampUTC($eventStart)->diffInWeeks($zerotimeForWeeks); //Week # from UNIX timestamp that this event first starts
		$repeatsInThisWeek = 0; //Check if valid
		
		if ($RecurWeeksInterval!="*"&&$RecurWeeksInterval!=null) {
			//If scope of requested time frame (startinterval-endinterval) is less than a week, adjust this
			if ($starttimeDiffInWeeks==$endtimeDiffInWeeks) {
				$testWeek = checkIfRecurringEventRepeatsInThisRange($requestedintervalUNIXstarttime, $requestedintervalUNIXendtime, $starttimeDiffInWeeks, $starttimeDiffInWeeks, $eventStartWeeks, $eventStart, $eventEnd, $RecurWeeksInterval, $eventEndsAfterTime, $eventEndsByTime, 'week');				 
				if ($testWeek!=null) { //Valid event, repeats in this week

					$nextStartEndUNIX = nextUNIXOccurrenceAfterRequestedStartInterval($starttimeDiffInWeeks, $starttimeDiffInWeeks, $eventStartWeeks, $eventStart, $eventEnd, $RecurWeeksInterval, 'week');
					$previousStartEndUNIX = previousUNIXOccurrenceBeforeRequestedStartInterval($starttimeDiffInWeeks, $starttimeDiffInWeeks, $eventStartWeeks, $eventStart, $eventEnd, $RecurWeeksInterval, 'week');

					if ($testWeek=="both") { //Both previous and next
						$dynamicGeneratedEvents[] = $nextStartEndUNIX;
						$dynamicGeneratedEvents[] = $previousStartEndUNIX;
					}
					else if ($testWeek=="next") { //Just next
						$dynamicGeneratedEvents[] = $nextStartEndUNIX;
					}
					else { //Just previous
						$dynamicGeneratedEvents[] = $previousStartEndUNIX;
					}
					$repeatsInThisWeek++; //Valid event
				}
			}
			//Every _ weeks
			while ($starttimeDiffInWeeks<$endtimeDiffInWeeks) { //Not <= b/c end of this week is the 00:00:00 time of the next week, so 244-245 is really 244 b/c that 245 is really Sunday, 00:00:00
				$testWeek = checkIfRecurringEventRepeatsInThisRange($requestedintervalUNIXstarttime, $requestedintervalUNIXendtime, $starttimeDiffInWeeks, $starttimeDiffInWeeks, $eventStartWeeks, $eventStart, $eventEnd, $RecurWeeksInterval, $eventEndsAfterTime, $eventEndsByTime, 'week');
				if ($testWeek!=null) { //One week at a time

					$nextStartEndUNIX = nextUNIXOccurrenceAfterRequestedStartInterval($starttimeDiffInWeeks, $starttimeDiffInWeeks, $eventStartWeeks, $eventStart, $eventEnd, $RecurWeeksInterval, 'week');
					$previousStartEndUNIX = previousUNIXOccurrenceBeforeRequestedStartInterval($starttimeDiffInWeeks, $starttimeDiffInWeeks, $eventStartWeeks, $eventStart, $eventEnd, $RecurWeeksInterval, 'week');

					if ($testWeek=="both") { //Both previous and next
						$dynamicGeneratedEvents[] = $nextStartEndUNIX;
						$dynamicGeneratedEvents[] = $previousStartEndUNIX;
					}
					else if ($testWeek=="next") { //Just next
						$dynamicGeneratedEvents[] = $nextStartEndUNIX;
					}
					else { //Just previous
						$dynamicGeneratedEvents[] = $previousStartEndUNIX;
					}
					$repeatsInThisWeek++; //Valid event
				}
				$starttimeDiffInWeeks++; //Set new range with which to look at the requested interval
				//End time stays the same - just slowly increment the start time so that the interval length decreases gradually
			}
			if ($repeatsInThisWeek==0) { //Doesn't repeat in this week
			//echo "weeknull";
				return null; //This event doesn't repeat in this month
			}
		}
		else {
			//Not weekly event
		}


		///// Monthly & Yearly (Just monthly*12) /////
		$RecurMonthsInterval = $se_meta_month; //This event repeats every _ months
		$RecurYearsInterval = $se_meta_year; //This event repeats every _ years
		if ($RecurYearsInterval!="*"&&$RecurYearsInterval!=null) { //This is a yearly event
			$RecurMonthsInterval = $RecurYearsInterval*12; //Every 3 years -> convert to 3*12 = 36 months
		}

		$eventStartMonths = Carbon::createFromTimeStampUTC($eventStart)->diffInMonths($zerotime); //Month # from UNIX timestamp that this event first starts
		$repeatsInThisMonth = 0; //Check if valid
		//Day of Month
		$RecurDayOfMonthInterval = (int) $se_meta_dayofmonth; //This event repeats every _th of the month
		//Day Occurrence in Month
		$RecurDayOccurrenceInMonthInterval = (int) $se_meta_dayoccurrenceinmonth; //This event repeats on the -_th- ___ of every month
		$RecurDayofWeekInterval = (int) $se_meta_dayofweek; //This event repeats on the _th -___- of the month

		if ($RecurMonthsInterval!="*"&&$RecurMonthsInterval!=null) {
			if ($RecurDayOfMonthInterval!="*"&&$RecurDayOfMonthInterval!=null) { //Repeats on a Day of Month
				//Every _ months, Day of Month
				//echo "Event Start Months: ".$eventStartMonths."\n";
				//echo "ID: ".$rowdata['se_id']."\n";
				//echo "starttimeDiffInMonths: ".$starttimeDiffInMonths." endtimeDiffInMonths: ".$endtimeDiffInMonths."\n";
				while ($starttimeDiffInMonths<=$endtimeDiffInMonths) { //Yes >= because next month must be included
					$testMonth = checkIfRecurringEventRepeatsInThisRange($requestedintervalUNIXstarttime, $requestedintervalUNIXendtime, $starttimeDiffInMonths, $starttimeDiffInMonths, $eventStartMonths, $eventStart, $eventEnd, $RecurMonthsInterval, $eventEndsAfterTime, $eventEndsByTime, 'month');
					if ($testMonth!=null) { //One month at a time

						$nextStartEndUNIX = nextUNIXOccurrenceAfterRequestedStartInterval($starttimeDiffInMonths, $starttimeDiffInMonths, $eventStartMonths, $eventStart, $eventEnd, $RecurMonthsInterval, 'month');
						$previousStartEndUNIX = previousUNIXOccurrenceBeforeRequestedStartInterval($starttimeDiffInMonths, $starttimeDiffInMonths, $eventStartMonths, $eventStart, $eventEnd, $RecurMonthsInterval, 'month');

						if ($testMonth=="both") { //Both previous and next
							$dynamicGeneratedEvents[] = $nextStartEndUNIX;
							$dynamicGeneratedEvents[] = $previousStartEndUNIX;
						}
						else if ($testMonth=="next") { //Just next
							$dynamicGeneratedEvents[] = $nextStartEndUNIX;
						}
						else { //Just previous
							$dynamicGeneratedEvents[] = $previousStartEndUNIX;
						}
						$repeatsInThisMonth++; //Valid event
					}
					$starttimeDiffInMonths++; //Set new range with which to look at the requested interval
					//End time stays the same - just slowly increment the start time so that the interval length decreases gradually
				}
			}
			else { //Repeats on a Day of Week
				//Every _ months, Day Occurrence of Month
				$RecurDayOccurrenceInMonthIntervalStringify = ($RecurDayOccurrenceInMonthInterval==1 ? "First" : ($RecurDayOccurrenceInMonthInterval==2 ? "Second" : ($RecurDayOccurrenceInMonthInterval==3 ? "Third" : ($RecurDayOccurrenceInMonthInterval==4 ? "Fourth" : "Last"))));
				$RecurDayofWeekIntervalStringify = ($RecurDayofWeekInterval==0 ? "Sunday" : ($RecurDayofWeekInterval==1 ? "Monday" : ($RecurDayofWeekInterval==2 ? "Tuesday" : ($RecurDayofWeekInterval==3 ? "Wednesday" : ($RecurDayofWeekInterval==4 ? "Thursday" : ($RecurDayofWeekInterval==5 ? "Friday" : ($RecurDayofWeekInterval==6 ? "Saturday" : "Saturday")))))));	
				while ($starttimeDiffInMonths<=$endtimeDiffInMonths) { //Yes >= because next month must be included
					//If this month fits the pattern of Every _th Month away from starting date
					if (($starttimeDiffInMonths-$eventStartMonths)%$RecurMonthsInterval==0) {
						//Start UNIX time of this Event in this _ month, where _ is September, or October
						$starttimeNthofNofMonth = strtotime($RecurDayOccurrenceInMonthIntervalStringify." ".$RecurDayofWeekIntervalStringify." of ".($monthNames[$starttimeDiffInMonths%12])." ".((int) ($starttimeDiffInMonths/12)+1970));
						//Since starttimeNthofNMonth and endtimeNthofNMonth don't take time into account, and thus are at 00:00:00 am, add back event's tim to these UNIX timestamps
						$starttimeNthofNofMonth += $eventStart%(60*60*24);
						$endtimeNthofNofMonth = $starttimeNthofNofMonth+($eventEnd-$eventStart); //Starttime of Event in this Month + Event's UNIX time length
						/*echo $RecurDayOccurrenceInMonthIntervalStringify." ".$RecurDayofWeekIntervalStringify." of ".($monthNames[$starttimeDiffInMonths%12])." ".((int) ($starttimeDiffInMonths/12)+1970)." ";
						echo "\n starttime: ".$starttimeNthofNofMonth;
						echo "\n endtime: ".$endtimeNthofNofMonth;
						echo "\n event start: ".$eventStart;
						echo "\n Event end: ".$eventEnd;
						echo "\n dayofweek: ".$RecurDayofWeekInterval;
						echo "\n \n";*/
						if (overlap($requestedintervalUNIXstarttime, $requestedintervalUNIXendtime, $starttimeNthofNofMonth, $endtimeNthofNofMonth)) {

							//Check Ends By and Ends After information
							//Ends By
							if (!is_null($endsByTime)&&$starttimeNthofNofMonth>$endsByTime) { //This occurrence occurs after this recurring event ends
								break;
							}
							//Ends After
							//Occurrence Number of next ocurrence
							$nextOccurrenceNumber = ($starttimeDiffInMonths-$eventStartMonths)/$RecurMonthsInterval;
							if (!is_null($eventEndsAfterTime)&&$nextOccurrenceNumber>=$eventEndsAfterTime) { //This occurrence occurs after this recurring event ends
								break;
							}

							//Valid
							$repeatsInThisMonth++;

							//Start time and end time of repeated event
							$dynamicGeneratedEvents[] = array($starttimeNthofNofMonth, $endtimeNthofNofMonth);
						}
					}
					$starttimeDiffInMonths++; //Set new range with which to look at the requested interval
					//End time stays the same - just slowly increment the start time so that the interval length decreases gradually
				}
			}
			if ($repeatsInThisMonth==0) { //Doesn't repeat in this month
				return null; //This event doesn't repeat in this month
			}
		}
		else {
			//Not a monthly or yearly event
		}

		//This event is a repeating event, AND it occurs in this interval
		//Now, we must calculate how many times it repeats and when it starts and ends (in UNIX timestamps)
		
		return $dynamicGeneratedEvents; //Return start and endtime UNIX array of this recurring event
	}


	function checkIfRecurringEventRepeatsInThisRange($requestedintervalUNIXstarttime, $requestedintervalUNIXendtime, $requestedintervalstarttime, $requestedintervalendtime, $eventstarttime, $eventUNIXstarttime, $eventUNIXendtime, $interval, $eventEndsAfterTime, $eventEndsByTime, $specifier) { //Starttime and endtime can be in days, weeks, months, or years
		$debug = false;
   		if ($debug) { echo "-checkifrecurringcalled-\n"; }
		$nextUNIX = nextUNIXOccurrenceAfterRequestedStartInterval($requestedintervalstarttime, $requestedintervalendtime, $eventstarttime, $eventUNIXstarttime, $eventUNIXendtime, $interval, $specifier);
		$previousUNIX = previousUNIXOccurrenceBeforeRequestedStartInterval($requestedintervalstarttime, $requestedintervalendtime, $eventstarttime, $eventUNIXstarttime, $eventUNIXendtime, $interval, $specifier);

		
		if ($specifier=="week") {  //Remember - UNIX epoch time starts on a Thursday, so subtract 4 days from 0 to get to Sunday as the start of the week
			//Check UNIX time against this too because we aren't just looking is the event is within requested UNIX start-end ; we are looking that it is within this specific day (or week, month, or year) too
			$requestedintervalUNIXstarttimeOfThisScopeRange = strtotime(date('c',-345600)." +".($requestedintervalstarttime)." ".$specifier."s"); //UNIX time
			$requestedintervalUNIXendtimeOfThisScopeRange = strtotime(date('c',-345600)." +".($requestedintervalendtime+1)." ".$specifier."s"); //UNIX time - end of this week (start of next week, since end times are exclusive)
		}
		else {
			$requestedintervalUNIXstarttimeOfThisScopeRange = strtotime(date('c',0)." +".($requestedintervalstarttime)." ".$specifier."s"); //UNIX time
			$requestedintervalUNIXendtimeOfThisScopeRange = strtotime(date('c',0)." +".($requestedintervalendtime+1)." ".$specifier."s"); //UNIX time
		}
		

		if ($debug) { 
			echo "Interval start UNIX: ".$requestedintervalUNIXstarttime."\n";
			echo "Interval end UNIX: ".$requestedintervalUNIXendtime."\n";
			echo "Next UNIX starts: ".$nextUNIX[0]." ; ends: ".$nextUNIX[1]."\n";
			echo "Previous UNIX starts: ".$previousUNIX[0]." ; ends: ".$previousUNIX[1]."\n";
		}

		//Check if in range of UNIX timespan
		$nextIsInRange = ($nextUNIX!=null)&&(($nextUNIX[0]>=$requestedintervalUNIXstarttime&&$nextUNIX[0]<=$requestedintervalUNIXendtime)||($nextUNIX[1]>=$requestedintervalUNIXstarttime&&$nextUNIX[1]<=$requestedintervalUNIXendtime))
						&&(($nextUNIX[0]>=$requestedintervalUNIXstarttimeOfThisScopeRange&&$nextUNIX[0]<=$requestedintervalUNIXendtimeOfThisScopeRange)||($nextUNIX[1]>=$requestedintervalUNIXstarttimeOfThisScopeRange&&$nextUNIX[1]<=$requestedintervalUNIXendtimeOfThisScopeRange));
		$previousIsInRange = ($previousUNIX!=null)&&(($previousUNIX[0]>=$requestedintervalUNIXstarttime&&$previousUNIX[0]<=$requestedintervalUNIXendtime)||($previousUNIX[1]>=$requestedintervalUNIXstarttime&&$previousUNIX[1]<=$requestedintervalUNIXendtime))
							&&(($previousUNIX[0]>=$requestedintervalUNIXstarttimeOfThisScopeRange&&$previousUNIX[0]<=$requestedintervalUNIXendtimeOfThisScopeRange)||($previousUNIX[1]>=$requestedintervalUNIXstarttimeOfThisScopeRange&&$previousUNIX[1]<=$requestedintervalUNIXendtimeOfThisScopeRange));

		//
		//Check if in range of Ends By or Ends After limits
		//
		//Ends By and Ends After (true if it does)
		$eventEndsBy = !is_null($eventEndsByTime);
		$eventEndsAfter = !is_null($eventEndsAfterTime);
		//Check Ends By and Ends After information
		if ($eventEndsBy) { //This occurrence starts after this recurring event ends
			if ($nextUNIX[0]>$eventEndsByTime) {
				$nextIsInRange = false;
			}
			if ($previousUNIX[0]>$eventEndsByTime) {
				$previousIsInRange = false;
			}
		}
		else if ($eventEndsAfter) { //This occurrence starts after this recurring event ends
			$nextOccurrenceNumber = (int) (($requestedintervalstarttime-$eventstarttime)/$interval); //Number 
			$previousOccurrenceNumber = $nextOccurrenceNumber-1;
			if ($nextOccurrenceNumber>=$eventEndsAfterTime-1) { //-1 to count the first time this event occurs
				$nextIsInRange = false;
			}
			if ($previousOccurrenceNumber>=$eventEndsAfterTime-1) {
				$previousIsInRange = false;
			}
		}

		if ($interval=="*"||$interval==null) { 
			if ($debug) { echo "true0\n"; }
			return "both";
		}
		else if ($requestedintervalstarttime>$requestedintervalendtime) {
			if ($debug) { echo "false1\n"; }
			return null;
		}
		else if ($nextIsInRange&&$previousIsInRange) {
			if ($debug) { echo "true-both\n"; }
			return "both";
		}
		else if ($nextIsInRange) {
			if ($debug) { echo "true-next\n"; }
			return "next";
		}
		else if ($previousIsInRange) {
			if ($debug) { echo "true-previous\n"; }
			return "previous";
		}
   		else {
			if ($debug) { echo "false2\n"; }
   			return null;
   		}
	}

	function nextUNIXOccurrenceAfterRequestedStartInterval($requestedintervalstarttime, $requestedintervalendtime, $eventstarttime, $eventUNIXstarttime, $eventUNIXendtime, $interval, $specifier) {
		//Start and End values for requested starttime/endtime are inclusive e.g. Week 234-235 is "234,235", 234-234 is "234,234"
		$debug = false;
		if ($debug) { echo "-nextunixfunctioncalled-\n"; }
		if ($interval=="*"||$interval==null) { 
			if ($debug) { echo "null1"; }
			return null;
		}
		if ($requestedintervalstarttime>$requestedintervalendtime) {
			if ($debug) { echo "null2"; }
			return null;
		}
		if ($eventstarttime>$requestedintervalendtime) { //Event starts after interval ends
			if ($debug) { echo "null3"; }
			return null;
		}
 		
		$eventUNIXlength = $eventUNIXendtime-$eventUNIXstarttime;

 		//Event starts after start of interval - it's next occurrence will be its start time
		if ($eventstarttime>=$requestedintervalstarttime) {
			if ($debug) { echo "eventstartswithintheinterval ".$eventUNIXstarttime; }
			return array($eventUNIXstarttime,$eventUNIXstarttime+$eventUNIXlength);
		}


		if ($debug) { echo "Prelim interval: ".$interval."\n"; }

		$startmod = ($requestedintervalstarttime-$eventstarttime)%$interval;
		$nextOccurrenceAfterRequestedStartInterval = ($requestedintervalstarttime+$interval-$startmod); //Time (in # of days, weeks, months, or years since UNIX 0) of next occurrence after the start of the requested interval
		$amountAddToEventStart = $nextOccurrenceAfterRequestedStartInterval-$eventstarttime; //# of days/weeks/months/years after original eventstarttime this repeated event occurs
		
		if ($debug) { echo "Prelim Amount to Add to Event start: ".$amountAddToEventStart."\n"; }
	  	
	  	if ($startmod==0) { //Event starts at the very beginning of the requested interval
	  		$amountAddToEventStart = $requestedintervalstarttime-$eventstarttime;
	  		$nextOccurrenceAfterRequestedStartInterval = $amountAddToEventStart;
		}
		if ($specifier=="day") {
			$amountAddToEventStart *=60*60*24; //Convert days to UNIX seconds
		}
		else if ($specifier=="week") {
			$amountAddToEventStart *=60*60*24*7; //Convert weeks to UNIX seconds
		}
		else if ($specifier=="month") {
			$amountAddToEventStart = strtotime(date('c', $eventUNIXstarttime)." +".$amountAddToEventStart."months")-$eventUNIXstarttime; //Convert months to UNIX seconds
		}
		else { //Years
			$amountAddToEventStart = strtotime(date('c', $eventUNIXstarttime)." +".$amountAddToEventStart."years")-$eventUNIXstarttime; //Convert months to UNIX seconds
		}
		if ($debug) {
			echo "eventUNIXlength: ".$eventUNIXlength.", ".($eventUNIXlength/(60*60*24))." days\n";
			echo "starttime/endtime Interval: ".$requestedintervalstarttime." ".$specifier."s - ".$requestedintervalendtime."s\n";
			echo "startmod: ".$startmod."\n";
			echo "eventstarttime: ".$eventstarttime." ".$specifier."\n";
			echo "Next Occurrence: ".$nextOccurrenceAfterRequestedStartInterval." ".$specifier."s\n";
			echo "Amount to Add to Event start: ".$amountAddToEventStart." ".($amountAddToEventStart/(60*60*24))." days\n";
			echo "StartUNIX: ".($eventUNIXstarttime+$amountAddToEventStart).", ".date('c', ($eventUNIXstarttime+$amountAddToEventStart))."\n";
			echo "EndUNIX: ".($eventUNIXstarttime+$amountAddToEventStart+$eventUNIXlength).", ".date('c', ($eventUNIXstarttime+$amountAddToEventStart+$eventUNIXlength))."\n";
	   	}
	   	//Returns array [0] -> UNIX Starttime, [1] -> UNIX Endtime

	   	//echo "called on event start".$eventstarttime;
		return array($eventUNIXstarttime+$amountAddToEventStart, $eventUNIXstarttime+$amountAddToEventStart+$eventUNIXlength);
	}

	function previousUNIXOccurrenceBeforeRequestedStartInterval($requestedintervalstarttime, $requestedintervalendtime, $eventstarttime, $eventUNIXstarttime, $eventUNIXendtime, $interval, $specifier) {
		if ($interval=="*"||$interval==null) { 
			return null;
		}
		if ($requestedintervalstarttime>$requestedintervalendtime) {
			return null;
		}
		if ($eventstarttime>=$requestedintervalendtime) { //Event starts after interval ends
			return null;
		}

		$eventUNIXlength = $eventUNIXendtime-$eventUNIXstarttime;
		$UNIXinterval = strtotime(date('c', $eventUNIXstarttime)." ".$interval." ".$specifier."s")-$eventUNIXstarttime;
		$nextUNIX = nextUNIXOccurrenceAfterRequestedStartInterval($requestedintervalstarttime, $requestedintervalendtime, $eventstarttime, $eventUNIXstarttime, $eventUNIXendtime, $interval, $specifier);

		$previousUNIX = $nextUNIX[0]-$UNIXinterval; //UNIX Time (from # of days, weeks, months, or years since UNIX 0) of previous occurrence, before the start of the requested interval
		
		return array($previousUNIX, $previousUNIX+$eventUNIXlength);
	}


	//////////////////////////////////
	//								//
	//								//
	//        SQL GET QUERIES
	//								//
	//								//
	//////////////////////////////////


	//USER INFORMATION

	//GET USER INFORMATION - USER ID -> PERSON OBJECT
	function getPersonObjs($mysqli, $userIDs) {
		$users = array(); //Array of Person Objs to be returned
		if ($stmt = $mysqli->prepare("SELECT m_fname, m_lname, m_email, m_school, m_grade, m_tom FROM m WHERE m_id=? LIMIT 1")) {
			for ($i = 0; $i<count($userIDs); $i++) {
				$userid = (int) $userIDs[$i];
				$stmt->bind_param('i', $userid);
				$stmt->execute(); //Execute the prepared query
				$stmt->store_result();
				$stmt->bind_result($fname, $lname, $email, $schoolid, $grade, $tom); // get variables from result.
				$stmt->fetch();

				$users[] = new person($userid, $fname." ".$lname, $tom, 
									$schoolid, $grade, 
									0, //Busy
									0, //Number of shared events
									array(), //Schedule events
									0); //Going status
				$users[count($users)-1]->setemail($email);
			}
			return $users;
		}
		else {
			return "dbfailure";
		}
	}


	//SQL FOR CHECKING IF USER CAN SEE AN EVENT
	function getSQLforCurrentUserCanSeeThisEvent($currentUserID, $currentUserSchoolID) {
		if ($currentUserID==="?") {
			$currentUserID = "?";
		}
		else {
			$currentUserID = (int) $currentUserID;
		}
		if ($currentUserSchoolID==="?") {
			$currentUserSchoolID = "?";
		}
		else {
			$currentUserSchoolID = (int) $currentUserSchoolID;
		}
		return 	" AND se.se_schoolid=".$currentUserSchoolID.
				" AND (se.se_visibility=1 OR (se.se_visibility=0 AND (in.in_userid=".$currentUserID." OR se.se_createdby=".$currentUserID."))) ";
		//Return Event: If...
		//		Belongs to current user's school AND
		//		(Public OR
		//		Private AND current user has been invited OR current user created event)
	}	


	//SQL FOR CHECKING IF USER CAN SEE AN EVENT SERIES
	function getSQLforCurrentUserCanSeeThisEventSeries($currentUserID, $currentUserSchoolID) {
		if ($currentUserID==="?") {
			$currentUserID = "?";
		}
		else {
			$currentUserID = (int) $currentUserID;
		}
		if ($currentUserSchoolID==="?") {
			$currentUserSchoolID = "?";
		}
		else {
			$currentUserSchoolID = (int) $currentUserSchoolID;
		}
		return 	" AND es.es_schoolid=".$currentUserSchoolID.
				" AND (es.es_visibility=1 OR (es.es_visibility=0 AND (in_es.in_es_userid=".$currentUserID." OR es.es_createdby=".$currentUserID."))) ";
		//Return Event Series: If...
		//		Belongs to current user's school AND
		//		(Public OR
		//		Private AND current user has been invited OR current user created series)
	}

	//
	//QUERY -> OBJECT AUTOMATION
	//

	//TRANSFER ROWDATA FROM SQL QUERY TO ARRAY OF SCHEDULE EVENT OBJECTS
	function convertQueryToScheduleEventObjects($queryResults) {

		$events = array(); //Array of schedule event objects to be returned, fully filled out

		$schoolid = (int) $rowdata['se_schoolid']; //Assume everyone belongs to same school

		for ($i = 0; $i<count($queryResults); $i++) {
			$rowdata = $queryResults[$i]; //Rowdata for this single returned row
			
			if (!is_null($rowdata['s_userid'])) {
				$belongsto = new person($rowdata['s_userid'], $rowdata['belongstoname'], $rowdata['belongstotom'], $rowdata['belongstoschool'], $rowdata['belongstograde'], 0);
			}
			else {
				$belongsto = null;
			}
			if (!is_null($rowdata['se_createdby'])) {
				$createdby = new person($rowdata['se_createdby'], $rowdata['createdbyname'], $rowdata['createdbytom'], $rowdata['createdbyschool'], $rowdata['createdbygrade'], 0);
			}
			else {
				$createdby = null;
			}

			//Customizable traits unique to each user - and fallback default if not already customized
			$color = (isvalidcolor($rowdata['s_color']) ? $rowdata['s_color'] : $rowdata['se_color']); //Default, fallback to original color creator of event specified
			$hw = ($rowdata['s_hw']!="" ? $rowdata['s_hw'] : $rowdata['se_hw']); //Homework for event
			$descrip = ($rowdata['s_description']!="" ? $rowdata['s_description'] : $rowdata['se_description']); //Description for event

			if (!is_null($rowdata['et_id'])) {
				$eventtag = new eventtag($rowdata['et_id'], $belongsto, $rowdata['et_createddate'], $rowdata['et_lastmodified'], $rowdata['et_name'], $rowdata['et_color'], $rowdata['et_colorevents'], null);
				//Tag color specified
				if (!is_null($rowdata['et_colorevents'])&&$rowdata['et_colorevents']==1) {
					$color = ($rowdata['et_color']!="" ? $rowdata['et_color'] : "");
				}
			}
			else {
				$eventtag = null;
			}
			if (!is_null($rowdata['se_teacher'])) {
				$teacher = new person($rowdata['se_teacher'], $rowdata['teachername'], $rowdata['teachertom'], $schoolid, $rowdata['teachergrade'], 0);
			}
			else {
				$teacher = null;
			}
			
			$events[$i] = new scheduleevent((int) $rowdata['se_id'], //Unique Event ID
										$belongsto, //Belongs To - Person Obj
										$createdby, //Created By - Person Obj
										$rowdata['se_name'], 
										(int) $rowdata['se_starttime'], //UNIX UTC start time
										(int) $rowdata['se_endtime'], //UNIX UTC end time
										date('c', $rowdata['se_starttime']), 
										date('c', $rowdata['se_endtime']), 
										(int) $rowdata['se_allday'], //1 if All Day, 0 if not
										(int) $rowdata['se_recur'], //1 if event recurs, 0 if one-time
										null, //Recurring Object - null for now
										"", //Occurs info - nothing for now
										(int) $rowdata['se_visibility'], //1 if public, 0 if private
										$color,
										$hw,
										$description,
										$eventtag, //Tag - Eventtag Obj
										$teacher, //Teacher - Person Obj
										null, //Invited - Array of Person Objs
										null, //Shared with - Array of Person Objs
										null); //Event Series - Array of EventSeries Objs
			//Add current user's permissions
			$events[$i]->setperms_modify($rowdata['in_perms_modify']);
			$events[$i]->setperms_seeothers($rowdata['in_perms_seeothers']);
			$events[$i]->setperms_inviteothers($rowdata['in_perms_inviteothers']);
		}
		return $events;
	}

	//TRANSFER ROWDATA FROM SQL QUERY TO ARRAY OF EVENT SERIES OBJECTS
	function convertQueryToEventSeriesObjects($queryResults) {

		$series = array(); //Array of eventseries objects to be returned, fully filled out

		$schoolid = (int) $rowdata['es_schoolid']; //Assume everyone belongs to same school

		for ($i = 0; $i<count($queryResults); $i++) {
			$rowdata = $queryResults[$i]; //Rowdata for this single returned row
			
			if (!is_null($rowdata['s_es_userid'])) {
				$belongsto = new person($rowdata['s_es_userid'], $rowdata['eventseriesbelongstoname'], 0, 0, $schoolid, 0);
			}
			else {
				$belongsto = null;
			}
			if (!is_null($rowdata['es_createdby'])) {
				$createdby = new person($rowdata['es_createdby'], $rowdata['eventseriescreatedbyname'], 0, 0, $schoolid, 0);
			}
			else {
				$createdby = null;
			}

			//Customizable traits unique to each user - and fallback default if not already customized
			$color = (isvalidcolor($rowdata['s_es_color']) ? $rowdata['s_es_color'] : $rowdata['es_color']); //Default, fallback to original color creator of event specified
			$hw = ($rowdata['s_es_homework']!="" ? $rowdata['s_es_hw'] : $rowdata['es_hw']); //Homework for event
			$descrip = ($rowdata['s_es_description']!="" ? $rowdata['s_es_description'] : $rowdata['es_description']); //Description for event

			if (!is_null($rowdata['s_es_eventtag'])) {
				$eventtag = new eventtag($rowdata['s_es_eventtag'], $belongsto, $rowdata['et_createddate'], $rowdata['et_lastmodified'], $rowdata['et_name'], $rowdata['et_color'], null);
			}
			else {
				$eventtag = null;
			}
			if (!is_null($rowdata['es_teacher'])) {
				$teacher = new person($rowdata['es_teacher'], $rowdata['eventseriesteachername'], $rowdata['eventseriesteachertom'], $schoolid, $rowdata['eventseriesteachergrade'], 0);
			}
			else {
				$teacher = null;
			}

			$series[$i] = new eventseries((int) $rowdata['es_id'], //Unique Event ID
												$belongsto, //Belongs To - Person Obj
												$createdby, //Created By - Person Obj
												$rowdata['es_name'], 
												(int) $rowdata['es_visibility'], //1 if public, 0 if private
												$color,
												$hw,
												$description,
												$eventtag, //Tag - Eventtag Obj
												$teacher, //Teacher - Person Obj
												null, //Invited - Array of Person Objs
												null, //Shared with - Array of Person Objs
												null); //Events - Array of ScheduleEvent Objs
			//Add current user's permissions
			$series[$i]->setperms_modify($rowdata['in_es_perms_modify']);
			$series[$i]->setperms_seeothers($rowdata['in_es_perms_seeothers']);
			$series[$i]->setperms_inviteothers($rowdata['in_es_perms_inviteothers']);
		}
		return $series;
	}


	//GET RECURRING METADATA FOR EVENT
	function getRecurringInfo($mysqli, $events, $schoolid, $userid) { //Input: Array of Scheduleevent Objects
		//Returns: Array of Scheduleevent Objects, with Recurring information added if the event recurs

		if (is_null($events)) {
			return null;
		}

		//Get events metadata - For Recurring information
		$sqlquery = "SELECT se.se_id, 
							se.se_starttime, se.se_endtime, 
							se_meta.se_meta_eventid, se_meta.se_meta_interval, se_meta.se_meta_starttime, se_meta.se_meta_endtime, se_meta.se_meta_day, se_meta.se_meta_week, se_meta.se_meta_dayofweek, se_meta.se_meta_month, se_meta.se_meta_dayofmonth, se_meta.se_meta_dayoccurrenceinmonth, se_meta.se_meta_thismonth, se_meta.se_meta_year, se_meta.se_meta_endsafter, se_meta.se_meta_endsby 
							FROM se 
							LEFT JOIN se_meta ON se.se_id=se_meta.se_meta_eventid 
							LEFT JOIN in ON se.se_id=in.in_eventid AND in.in_userid=".$userid."
							WHERE se.se_id=? ".
							getSQLforCurrentUserCanSeeThisEvent($userid, $schoolid)."
							AND (se_meta.se_meta_eventid=? OR ISNULL(se_meta.se_meta_eventid)) ORDER BY se.se_id";
		if ($stmt = $mysqli->prepare($sqlquery)) {
			for ($i = 0; $i<count($events); $i++) {
				if ($events[$i]->getrecur()==1) { //Recurring event, set up a Recurring Event Object to take care of this
					$eventid = $events[$i]->getid();
					$stmt->bind_param('ii', $eventid, $eventid);
					$stmt->execute();
					$stmt->store_result();
					$rowdata = array(); //Create array to hold all data in returned row
					stmt_bind_assoc($stmt, $rowdata); //Get all values in row

					$counterOfReturnedMetaRows = 0;
					$recursSummaryObj = null;

					while ($stmt->fetch()) { //Store all events data
						if ($counterOfReturnedMetaRows==0) {
							$ereventBlockStart = $rowdata['se_meta_starttime'];
							$ereventBlockEnd = $rowdata['se_meta_endtime'];
							$eallday = $events[$i]->getallday();
							$erday = $rowdata['se_meta_day'];
							$erweek = $rowdata['se_meta_week'];
							$erdayOfWeek = $rowdata['se_meta_dayofweek'];
							$ermonth = $rowdata['se_meta_month'];
							$erdayOfMonth = $rowdata['se_meta_dayofmonth'];
							$erdayOccurrenceInMonth = $rowdata['se_meta_dayoccurrenceinmonth'];
							$eryear = $rowdata['se_meta_year'];
							$erthisMonth = $rowdata['se_meta_thismonth'];
							$erendsAfterOccurrences = $rowdata['se_meta_endsafter'];
							$erendsAfter = ($erendsAfterOccurrences=="*"||$erendsAfterOccurrences=="" ? false: true);
							$erendsByTime = $rowdata['se_meta_endsby'];
							$erendsBy = ($erendsByTime=="*"||$erendsByTime=="" ? false : true);
							$erendsNever = ($erendsBy||$erendsAfter ? false : true);
							$recursSummaryObj = new RecursObj($ereventBlockStart, $ereventBlockEnd, $eallday, $erday, $erweek, array(), $ermonth, $erdayOfMonth, $erdayOccurrenceInMonth, $eryear, $erthisMonth, $erendsNever, $erendsAfter, $erendsAfterOccurrences, $erendsBy, $erendsByTime); //Recurs summary object
							if (($erweek!="*"&&$erweek!=null)||($ermonth!="*"&&$ermonth!=null)||($eryear!="*"&&$eryear!=null)) { //Weekly, Monthly, or Yearly
								$recursSummaryObj->addDayOfWeek($erdayOfWeek, $ereventBlockStart, $ereventBlockEnd);
							}
						}
						else { //2+ row returned, going to be a weekly event, so add day of week to Recurs Object
							$erdayOfWeek = $rowdata['se_meta_dayofweek'];
							$ereventBlockStart = $rowdata['se_meta_starttime'];
							$ereventBlockEnd = $rowdata['se_meta_endtime'];
							$recursSummaryObj->addDayOfWeek($erdayOfWeek, $ereventBlockStart, $ereventBlockEnd);
						}
						$counterOfReturnedMetaRows++;
					}
					$events[$i]->setrecurobjwithobj($recursSummaryObj);
				}
			}
		}
		else {
			return null;
		}
		return $events;
	}



	//GET SHARED WITH PEOPLE FOR EVENT
	function getSharedWithPersons($mysqli, $events, $schoolid, $currentUserID, $includeCurrentUserInSharedWith = false) { //Input: Array of Scheduleevent Objects
		//Returns: Array of Scheduleevent Objects, with sharedwith attributes added

		if (is_null($events)) {
			return null;
		}

		//Since each Weekly repeat will have multiple rows, we need to filter out repeated event IDs
		$eventIDs = array();
		for ($i = 0; $i<count($events); $i++) {
			$eventIDs[] = $events[$i]->getid();
		}
		$eventIDs = array_values(array_unique($eventIDs));

		//Sanitize variables
		$currentUserID = (int) $currentUserID;
		$schoolid = (int) $schoolid;
		$excludeCurrentUser = (bool) !$includeCurrentUserInSharedWith;

		//Get everyone who added this event to their schedules, excluding current user

		//Public events
		if ($stmt = $mysqli->prepare("SELECT m.m_id, m.m_fname, m.m_lname, m.m_grade, m.m_tom, m.m_school 
											FROM se
											LEFT JOIN s ON se.se_id=s.s_eventid 
											LEFT JOIN m ON s.s_userid=m.m_id
											WHERE se.se_id=? 
											AND se.se_schoolid=? 
											AND se.se_visibility=1 
											AND NOT ISNULL(m.m_id) 
											ORDER BY se.se_id, m.m_id")) { //Ignore current user - he can't share the event with himself
			for ($i = 0; $i<count($eventIDs); $i++) {
				$eventid = $eventIDs[$i];
				//School ID is the same as the current user's school ID
				$stmt->bind_param('ii', $eventid, $schoolid);
				$stmt->execute();
				$stmt->store_result();
				$rowdata = array(); //Create array to hold all data in returned row
				stmt_bind_assoc($stmt, $rowdata); //Get all values in row

				while ($stmt->fetch()) {
					//If we are excluding the Current User and this $rowdata is the current user, ignore it
					if ($excludeCurrentUser&&$rowdata['m_id']==$currentUserID) {
						continue;
					}
					for ($g = 0; $g<count($events); $g++) {
						if ($events[$g]->getid()==$eventid) {
							$events[$g]->addsharedwithperson(new person($rowdata['m_id'], 
																	$rowdata['m_fname']." ".$rowdata['m_lname'], 
																	$rowdata['m_tom'], 
																	$rowdata['m_school'],
																	$rowdata['m_grade'], 
																	$rowdata['busy'], 
																	0, 
																	array(),
																	null));//NULL b/c event is public
						}
					}
				}
			}
		}
		else {
			//Error with getting shared status - OK, gracefully degrade and still return events, just without shared with information
		}
		//Private events
		if ($stmt = $mysqli->prepare("SELECT m.m_id, m.m_fname, m.m_lname, m.m_grade, m.m_tom, m.m_school, 
											in.in_accepted, 
											(
												(SELECT checkifcurrentusercanseeothers.in_perms_seeothers 
													FROM in AS checkifcurrentusercanseeothers 
													WHERE checkifcurrentusercanseeothers.in_eventid=se.se_id 
													AND checkifcurrentusercanseeothers.in_userid=".$currentUserID."
												)=1 
												OR se.se_createdby=".$currentUserID." 
											) AS currentUserCanSeeOtherGuests ".//User has ability to see other people invited to event (either has permission, or created event himself)
											"FROM se
											LEFT JOIN in ON in.in_eventid=se.se_id ".//People who are invited to event
											"LEFT JOIN m ON in.in_userid=m.m_id
											WHERE se.se_id=? 
											AND se.se_schoolid=? 
											AND se.se_visibility=0
											AND NOT ISNULL(m.m_id) 
											ORDER BY se.se_id, m.m_id")) { //Ignore current user - he can't share the event with himself
			for ($i = 0; $i<count($eventIDs); $i++) {
				$eventid = $eventIDs[$i];
				//School ID is the same as the current user's school ID
				$stmt->bind_param('ii', $eventid, $schoolid);
				$stmt->execute();
				$stmt->store_result();
				$rowdata = array(); //Create array to hold all data in returned row
				stmt_bind_assoc($stmt, $rowdata); //Get all values in row

				while ($stmt->fetch()) {
					//If we are excluding the Current User and this $rowdata is the current user, ignore it
					if ($excludeCurrentUser&&$rowdata['m_id']==$currentUserID) {
						continue;
					}
					for ($g = 0; $g<count($events); $g++) {
						if ($events[$g]->getid()==$eventid) {
							if ($rowdata['currentUserCanSeeOtherGuests']==1) { //Current user can see other guests - don't anonymize data
								$events[$g]->addsharedwithperson(new person($rowdata['m_id'], 
																	$rowdata['m_fname']." ".$rowdata['m_lname'], 
																	$rowdata['m_tom'], 
																	$rowdata['m_school'],
																	$rowdata['m_grade'], 
																	$rowdata['busy'], 
																	0, 
																	array(),
																	$rowdata['in_accepted'])); //Will be -1, 0, or 1 if this event is private - otherwise, it will be NULL
							}
							else { //Anonymize data - Current user can't see guests, but he can see number of people invited, and whether they accepted or not
								$events[$g]->addsharedwithperson(new person(0, 
																	"Anonymous", 
																	0, 
																	0,
																	0, 
																	0, 
																	0, 
																	array(),
																	$rowdata['in_accepted'])); //Will be -1, 0, or 1 if this event is private - otherwise, it will be NULL
							}
						}
					}
				}
			}
		}
		else {
			//Error with getting shared status - OK, gracefully degrade and still return events, just without shared with information
		}
		return $events;
	}


	//GET SHARED WITH PEOPLE FOR EVENT SERIES
	function getSharedWithPersonsEventSeries($mysqli, $series, $schoolid, $currentUserID) { //Input: Array of Eventseries Objects
		//Returns: Array of Eventseries Objects, with sharedwith attributes added

		if (is_null($series)) {
			return null;
		}

		//Filter out repeated series IDs
		$seriesIDs = array();

		for ($i = 0; $i<count($series); $i++) {
			$seriesIDs[] = $series[$i]->getid();
		}
		
		$seriesIDs = array_values(array_unique($seriesIDs));

		//Sanitize variables
		$currentUserID = (int) $currentUserID;
		$schoolid = (int) $schoolid;

		//Get everyone who added this event to their schedules, excluding current user

		//Public series
		if ($stmt = $mysqli->prepare("SELECT m.m_id, m.m_fname, m.m_lname, m.m_grade, m.m_tom, m.m_school 
											FROM es
											LEFT JOIN s_es ON es.es_id=s_es.s_es_seriesid 
											LEFT JOIN m ON s_es.s_es_userid=m.m_id
											WHERE es.es_id=? 
											AND es.es_schoolid=? 
											AND es.es_visibility=1 
											AND m.m_id<>? 
											AND NOT ISNULL(m.m_id) 
											ORDER BY es.es_id, m.m_id")) { //Ignore current user - he can't share the event with himself
			for ($i = 0; $i<count($seriesIDs); $i++) {
				$seriesid = $seriesIDs[$i];
				//School ID is the same as the current user's school ID
				$stmt->bind_param('iii', $seriesid, $schoolid, $currentUserID);
				$stmt->execute();
				$stmt->store_result();
				$rowdata = array(); //Create array to hold all data in returned row
				stmt_bind_assoc($stmt, $rowdata); //Get all values in row

				while ($stmt->fetch()) {
					for ($g = 0; $g<count($series); $g++) {
						if ($series[$g]->getid()==$seriesid) {
							$series[$g]->addsharedwithperson(new person($rowdata['m_id'], 
																	$rowdata['m_fname']." ".$rowdata['m_lname'], 
																	$rowdata['m_tom'], 
																	$rowdata['m_school'],
																	$rowdata['m_grade'], 
																	$rowdata['busy'], 
																	0, 
																	array(),
																	null));//NULL b/c event is public
						}
					}
				}
			}
		}
		else {
			//Error with getting shared status - OK, gracefully degrade and still return series, just without shared with information
		}
		//Private series
		if ($stmt = $mysqli->prepare("SELECT m.m_id, m.m_fname, m.m_lname, m.m_grade, m.m_tom, m.m_school, 
											in_es.in_es_accepted, 
											(
												(SELECT checkifcurrentusercanseeothers.in_es_perms_seeothers 
													FROM in_es AS checkifcurrentusercanseeothers 
													WHERE checkifcurrentusercanseeothers.in_es_seriesid=es.es_id 
													AND checkifcurrentusercanseeothers.in_es_userid=".$currentUserID."
												)=1 
												OR es.es_createdby=".$currentUserID." 
											) AS currentUserCanSeeOtherGuests ".//User has ability to see other people invited to event (either has permission, or created event himself)
											"FROM es
											LEFT JOIN in_es ON in_es.in_es_seriesid=es.es_id ".//People who are invited to event
											"LEFT JOIN m ON in_es.in_es_userid=m.m_id
											WHERE es.es_id=? 
											AND es.es_schoolid=? 
											AND es.es_visibility=0
											AND m.m_id<>? 
											AND NOT ISNULL(m.m_id) 
											ORDER BY es.es_id, m.m_id")) { //Ignore current user - he can't share the event with himself
			for ($i = 0; $i<count($seriesIDs); $i++) {
				$seriesid = $seriesIDs[$i];
				//School ID is the same as the current user's school ID
				$stmt->bind_param('iii', $seriesid, $schoolid, $currentUserID);
				$stmt->execute();
				$stmt->store_result();
				$rowdata = array(); //Create array to hold all data in returned row
				stmt_bind_assoc($stmt, $rowdata); //Get all values in row

				while ($stmt->fetch()) {
					for ($g = 0; $g<count($series); $g++) {
						if ($series[$g]->getid()==$seriesid) {
							if ($rowdata['currentUserCanSeeOtherGuests']==1) { //Current user can see other guests - don't anonymize data
								$series[$g]->addsharedwithperson(new person($rowdata['m_id'], 
																	$rowdata['m_fname']." ".$rowdata['m_lname'], 
																	$rowdata['m_tom'], 
																	$rowdata['m_school'],
																	$rowdata['m_grade'], 
																	$rowdata['busy'], 
																	0, 
																	array(),
																	$rowdata['in_es_accepted'])); //Will be -1, 0, or 1 if this event is private - otherwise, it will be NULL
							}
							else { //Anonymize data - Current user can't see guests, but he can see number of people invited, and whether they accepted or not
								$series[$g]->addsharedwithperson(new person(0, 
																	"Anonymous", 
																	0, 
																	0,
																	0, 
																	0, 
																	0, 
																	array(),
																	$rowdata['in_es_accepted'])); //Will be -1, 0, or 1 if this event is private - otherwise, it will be NULL
							}
						}
					}
				}
			}
		}
		else {
			//Error with getting shared status - OK, gracefully degrade and still return series, just without shared with information
		}
		return $series;
	}



	//GET EVENT SERIES INFORMATION FOR EVENT SERIES THAT THIS EVENT BELONGS TO
	function getEventSeriesInformation($mysqli, $events, $schoolid, $currentUserID) { //Input: Array of Scheduleevent Objects
		//Returns: Array of Scheduleevent Objects, with eventseries information added
		
		if (is_null($events)) {
			return null;
		}

		//Filter out repeated event IDs
		$eventIDs = array();
		for ($i = 0; $i<count($events); $i++) {
			$eventIDs[] = (int) $events[$i]->getid();
		}
		
		$eventIDs = array_values(array_unique($eventIDs));

		//Sanitize variables
		$currentUserID = (int) $currentUserID;
		$schoolid = (int) $schoolid;

		$sqlquery = "SELECT es.es_id, es.es_name, es.es_createdby, es.es_createddate, es.es_teacher, es.es_color, es.es_description, es.es_hw, es.es_visibility, es.es_schoolid, 
								s_es.s_es_color, s_es.s_es_hw, s_es.s_es_description, 
								CONCAT(m.m_fname, ' ', m.m_lname) AS eventseriescreatedbyname 
								FROM es
								LEFT JOIN es_events ON es_events.es_events_seriesid=es.es_id 
								LEFT JOIN se ON se.se_id=es_events.es_events_eventid 
								LEFT JOIN s_es ON s_es_seriesid=es.es_id AND s_es.s_es_userid=".$currentUserID." 
								LEFT JOIN m ON m.m_id=es.es_createdby 
								LEFT JOIN in_es ON es_events.es_events_seriesid=in_es.in_es_seriesid AND in_es.in_es_userid=".$currentUserID."
								WHERE se.se_id=? ".
								getSQLforCurrentUserCanSeeThisEventSeries($currentUserID, $schoolid)."
								ORDER BY es.es_id";

		if ($stmt = $mysqli->prepare($sqlquery)) {
			for ($i = 0; $i<count($eventIDs); $i++) {
				$eventid = (int) $eventIDs[$i];
				//School ID is the same as the current user's school ID
				$stmt->bind_param('i', $eventid);
				$stmt->execute();
				$stmt->store_result();
				$rowdata = array(); //Create array to hold all data in returned row
				stmt_bind_assoc($stmt, $rowdata); //Get all values in row

				while ($stmt->fetch()) {
					for ($g = 0; $g<count($events); $g++) {
						if ($events[$g]->getid()==$eventid) {
							$eventseries = convertQueryToEventSeriesObjects(array($rowdata));
							$events[$g]->addeventseries($eventseries[0]);
						}
					}
				}
			}
		}
		else {
			//Error with getting event series status - OK, gracefully degrade and still return events, just without event series information
		}
		return $events;
	}



	//
	//
	//ARRAYS
	//
	//


	function copyRowdataToArray(&$newArray, $rowdata) {
		foreach ($rowdata as $key => $value) {
			$newArray[$key] = $value;
		}
	}


	//
	//
	//OUTPUT
	//
	//

	//PRETTY PRINT
	function prettyprint($input) {
		if (is_object($input)||is_array($input)) {
			echo '<pre>';
			print_r($input);
			echo '</pre>';
		}
		else {
			echo 'Input to <b>prettyprint()</b> is not an array/object.';
		}
	}


	//ALERT THIS STRING
	function alert($string) {
		echo 	'<script type="text/javascript">
					alert("'.trim(preg_replace('/\s\s+/', ' ', $string)).'");
				</script>';
	}
	
	//HOT FUNCTION -- CALCULATE SCORE OF EACH TOPIC
	function calchotscore($mysqli,$poemid) {
		$s = (int) gettopicdata($mysqli,"upvotes","return")- (int) gettopicdata($mysqli,"downvotes","return"); //Get score
		if (!is_numeric($topicid)) { //Prevent SQL Injection from invalid URL variables
			echo "Invalid request.";
		}
		else {
			$topicid=(int) $topicid;
			$order = log(max(abs($s), 1), 10); //Calculate order score
			if ($s>0) { //Determine +/- sign
				$sign=1;
			}
			else if ($s==0) {
				$sign=1;
			}
			else {
				$sign=-1;
			}
			$seconds = time() - 1134028003; //Get time since 1/1/1970
			$hotscore=round($order + (($sign * $seconds)/45000), 7); //Calculate hot score
			if ($insert_stmt = $mysqli->prepare("UPDATE topics SET topics_hotscore=? WHERE topics_id=?")) { //Prepare SQL statement
				$insert_stmt->bind_param('di', $hotscore, $topicid); //Bind parameters
				$insert_stmt->execute();// Execute the prepared query.
			}
		}
	}


	//GET ARRAY OF DATA FROM MATCHED ROW OF DATABASE
	function stmt_bind_assoc(&$stmt, &$out) {
		$data = mysqli_stmt_result_metadata($stmt);
		$fields = array();
		$out = array();

		$fields[0] = $stmt;
		$count = 1;

		while($field = mysqli_fetch_field($data)) {
			$fields[$count] = &$out[$field->name];
			$count++;
		}   
		call_user_func_array('mysqli_stmt_bind_result', $fields);
	}
	
	
	//CONVERT UNIX TIMESTAMP TO READABLE DATE
	function unixtodate($datestring, $format = "D, d M Y") {
		//Type of output data format
		if ($format=="hours") {
			$format = "g:ia";
		}
		else if ($format=="date") {
			$format = "n/j";
		}
		else if ($format=="dayofweek") {
			$format = "l";
		}
		//Check if input is an int, meaning that it is already strtotime()
		if (is_int($datestring)) {
			return gmdate($format, $datestring);
		}
		else { //Regular string date
			return gmdate($format, strtotime($datestring));
		}
	}
	

	//CONVERT TWO START AND END UNIX TIMESTAMPS TO FORMATTED DATE ARRAY => [0] -> Time [1] -> Date //Use for the shadow text underneath scheduleevent divs in Add Schedule Events, Eventslist
	function formatetimeanddate($starttime, $endtime, $isallday) {
		//Determine how to respresent time (e.g. All Day or set time)
		if ($isallday) { //Event is allday
			$time = "All day";
		}
		else {
			$time = unixtodate($starttime, "hours")." - ".unixtodate($endtime, "hours");
		}
		
		//Determine how to represent date (e.g. recurring, then "Every week, Monday and Thursday or just once, then "4/25-29, Monday-Thursday")

		if (issameday($starttime, $endtime)) { //Event only spans one day
			$date = unixtodate($starttime, "date").", ".unixtodate($starttime, "dayofweek");
		}
		else { //Event spans multiple days
			$date = unixtodate($starttime, "date")." - ".unixtodate($endtime, "date").", ".unixtodate($starttime, "dayofweek")."-".unixtodate($endtime, "dayofweek");
		}
		return array($time, $date); //Return array [0] -> Time, [1] -> Date
	}

	//CONVERT GMT FORMATTED DATE TO UNIX TIME GMT+0
	function gmttounix($time) {
		return (int) strtotime(preg_replace("/GMT\-[0-9]{4}/", "GMT-0000",$time));
	}


	//CONVERT UNIX TIMESTAMP TO TIMEZONE ADJUSTED TIMESTAMP
	function unixTimezoneAdjust($time) {
		return $time-$_COOKIE['timezone_offset']*60; //$_COOKIE['timezone_offset'] is in minutes, so multiply by 60 to get seconds to add to UNIX timestamp
	}
	
	//CHECK IF TWO UNIX TIMESTAMPS ARE FROM SAME DAY
	function issameday($start, $end) {
		$s = gmdate("n/j/Y", $start); //Return month/day/year
		$e = gmdate("n/j/Y", $end); //Returns month/day/year
		return ($s==$e);
	}
	
	//CHECK IF TWO DATES (EACH HAVING A START AND ENDING UNIX TIMESTAMP) OVERLAP
	function overlap($s1, $e1, $s2, $e2) {
		$s1 = (int) $s1;
		$e1 = (int) $e1;
		$s2 = (int) $s2;
		$e2 = (int) $e2;
		return (($s1<$e2)&&($e1>$s2)); //(StartDate1 < EndDate2) and (EndDate1 > StartDate2) http://stackoverflow.com/a/325939
	}
	
	
	//HTML PURIFIER
	function htmlpurify($dirtyhtml) {
		$config = HTMLPurifier_Config::createDefault();
		$purifier = new HTMLPurifier($config);		
		$clean_html = $purifier->purify($dirtyhtml);
		return $clean_html;
	}

	//NUMBER SUFFIX
	function numberSuffix($i) {
		$j = $i % 10;
		if ($j == 1 && $i != 11) {
			return "st";
		}
		if ($j == 2 && $i != 12) {
			return "nd";
		}
		if ($j == 3 && $i != 13) {
			return "rd";
		}
		return "th";
	}

	//FILTER STRING TO PREVENT XSS
	function preventxss($inputstring) {
		return htmlspecialchars($inputstring, ENT_QUOTES, 'UTF-8');
	}

	function isvalidemail($email) {
		$normal = "/@/";
		if (preg_match($normal, $email)) {
			if (preg_match("/[a-z0-9-]+(\.[a-z0-9-]+)*\.([a-z]{2,})$/", $email)) {
				return true;
			}
			else {
				return false;
			}	
		}
		else {
			return false;
		}
	}
	
	function isvalidschool($string) {
		if ($string>3) {
			return true;
		}
		else {
			return false;
		}
	}

	function isvalidcolor($color) {
		return preg_match('/#([a-f]|[A-F]|[0-9]){3}(([a-f]|[A-F]|[0-9]){3})?\b/', $color);
	}

	//Sort Array of Scheduleevent Objects by their starttimes
	function sortScheduleEventObjsByStartTime(&$arrayOfObjs) {
		usort($arrayOfObjs, function($a, $b) {
			return strcmp($a->getstarttime(), $b->getstarttime());
		});
	}
	//Sort Array of Scheduleevent Objects by the number of shared with people (popularity)
	function sortScheduleEventObjsBySharedWith(&$arrayOfObjs) {
		usort($arrayOfObjs, function($a, $b) {
			return strcmp($a->getsharedwithcount(), $b->getsharedwithcount());
		});
	}
	//Sort Array of EventSeries Objects by their created date
	function sortEventSeriesObjsByCreatedDate(&$arrayOfObjs) {
		usort($arrayOfObjs, function($a, $b) {
			return strcmp($a->getcreateddate(), $b->getcreateddate());
		});
	}
	
?>