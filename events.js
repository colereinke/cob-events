var cobClubs = [];
var cobEvents = [];
var apiRequest = new XMLHttpRequest();
//get all organizations and filter by ones that have a category of College of Business
apiRequest.open('GET', "https://api.presence.io/uwosh/v1/organizations");
apiRequest.onload = function() {
    if(apiRequest.status >= 200 && apiRequest.status <= 400) 
    {
        //conncection successful
        var organizations = JSON.parse(apiRequest.responseText);
        for(var i = 0; i < organizations.length; i++) 
        {
            //only push organizations associated with the College of Business
            var org = organizations[i];
            if(org.categories.includes("OSH - College of Business")) 
            {
                cobClubs.push({ uri: org.uri, name: org.name });
            }
        }
        if(cobClubs.length > 0) {
            //Get the events for the first club 
            //get events will call itself recursively in it's on load so the requests are only made one at a time
            getEvents(0);
        }
    } 
};
apiRequest.onerror = function() 
{
    console.log("Error occured connecting to organizations");
}
apiRequest.send();

//gets events from the cobClubs[index] organization.  Then call the next one if there is another club in the array recursively
var getEvents = function(index) {
    cobOrg = cobClubs[index];
    apiRequest.open('GET', "https://api.presence.io/uwosh/v1/organizations/events/" + cobOrg.uri);
    apiRequest.onload = function() 
    {
        if(apiRequest.status >= 200 && apiRequest.status <= 400)
        {
            events = [];
            if(apiRequest.responseText != "") {
                events = JSON.parse(apiRequest.responseText);
            }
            for(var j = 0; j < events.length; j++)
            {
                var event = events[j];
                event.startDate = new Date(event.startDateTimeUtc);
                cobEvents.push(
                    {
                        orgName: cobOrg.name.slice(5),
                        eventName: event.name,
                        startDate: event.startDate,
                        location: event.location,
                        eventUri: event.uri
                    });
            }
            //Recursive call
            index ++;
            if(index < cobClubs.length) {
                getEvents(index);
            } else {
                //All events have been found for all COB clubs
                //sort events by date
                cobEvents.sort((a, b) => (a.startDate > b.startDate) ? 1 : -1);
                //change time format and start building html string to be appended to page
                var content = "";
                for(var x = 0; x < cobEvents.length; x++)
                {
                    cobEvent = cobEvents[x];
                    cobEvent.startDate = cobEvent.startDate.toLocaleDateString("en-US", {timeZone: "Canada/Central"}) + " " + cobEvent.startDate.toLocaleTimeString("en-US", { timeZone: "Canada/Central", hour12: true, hour: "2-digit", minute: "2-digit" });
                    //header event list event
                    content += "<li id='tcevent_" + x + "'>";
                    //create ul for event details
                    content += "<ul id='tcevent_details_" + x + "'>";
                    //create an li for the event name
                    if(cobEvent.eventName != "") {
                        content += "<li class='event_name'><a href='http://uwosh.presence.io/event/" + cobEvent.eventUri + "'>" + cobEvent.eventName + "</a></li>";
                    }
                    //create an li for the org name
                    if(cobEvent.orgName != "") {
                        content += "<li class='event_organizer'>" + cobEvent.orgName + "</li>";
                    }
                    //create an li for the date/time
                    if(cobEvent.startDate != "") {
                        content += "<li class='event_date'>" + cobEvent.startDate + "</li>";
                    }
                    //create an li for the location
                    if(cobEvent.location != "") {
                        content += "<li class='event_location'>" + cobEvent.location + "</li>";
                    }
                    //close up the ul and the li
                    content += "</ul></li>";
                }
                $("#Presence").append(content);
            }
        }
    }
    apiRequest.onerror = function() {
        console.log("Error occurred connecting to clubs events");
    }
    apiRequest.send();
}

