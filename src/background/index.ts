import { messageService } from "./services/MessageService";
import { schedulerService } from "./services/SchedulerService";

// Initialize services
// The services set up their own listeners in their constructors.
console.log("CF Mentor: Background services initialized.", {
  messageService,
  schedulerService,
});