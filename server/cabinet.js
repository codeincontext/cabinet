Meteor.startup(function () {

  Tasks.remove({})

  if (Tasks.find().count() == 0) {
    console.log("Tasks list is empty. Populating from file");
    _.each(Assets.getText("tasks.txt").split("\n"), function (line) {
      if (line.length) Tasks.insert({name: line, active: false});
    });
  }

  Meteor.publish("tasks", function () {
    return Tasks.find({});
  });

  Meteor.publish("situations", function () {
    return Situations.find({});
  });

  Meteor.publish("players", function () {
    return Players.find({});
  });

  Meteor.onConnection(function () {
    console.log("User connected. Should assign cards");
  });

  // code to run on server at startup
  Meteor.methods({
    removeAll: function() {
      Tasks.remove({});
      Players.remove({});
      Situations.remove({});
    }
  });
});

