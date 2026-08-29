import { LinkedInRepository } from "./repositories/linkedin.repository.js";
import { LinkedInService } from "./services/linkedin.service.js";
import { LinkedInController } from "./controllers/linkedin.controller.js";


const linkedInRepository = new LinkedInRepository();
const linkedInService = new LinkedInService(linkedInRepository);
export const linkedInController = new LinkedInController(linkedInService);
