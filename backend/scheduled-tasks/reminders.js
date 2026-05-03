const cron = require('node-cron');
const Task = require('../models/Task');
const { pushToUser } = require('../utils/socket-utils');

function startReminderCron(io) {
  // ───── Reminders cron (every minute) ─────
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    try {
      const due = await Task.find({
        completed: false,
        reminded: false,
        reminderAt: { $lte: now, $ne: null },
      });

      for (const task of due) {
        const payload = {
          taskId: task._id.toString(),
          title: task.title,
          message: `⏰ Reminder: "${task.title}"`,
          reminderAt: task.reminderAt,
        };

        if (task.roomId) io.to(task.roomId).emit('task-reminder', payload);
        pushToUser(io, task.userId, 'task-reminder', payload);

        task.reminded = true;
        await task.save();
      }
    } catch (e) {
      console.error('reminder cron:', e);
    }
  });

  console.log('⏰ Reminder cron job started');
}

module.exports = { startReminderCron };
