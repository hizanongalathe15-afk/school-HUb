import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { chatGroupController } from '../controllers/chatGroupController.js';

const router = Router();

router.get('/', auth, chatGroupController.list);
router.post('/', auth, chatGroupController.create);
router.patch('/:id', auth, chatGroupController.update);
router.post('/:id/members', auth, chatGroupController.addMembers);
router.post('/:id/messages', auth, chatGroupController.send);
router.delete('/:id/messages', auth, chatGroupController.deleteMessages);
router.post('/:id/clear', auth, chatGroupController.clear);
router.post('/:id/archive', auth, chatGroupController.archive);
router.post('/:id/mute', auth, chatGroupController.mute);
router.post('/:id/disappearing', auth, chatGroupController.disappearing);
router.post('/:id/theme', auth, chatGroupController.theme);
router.post('/:id/shortcut', auth, chatGroupController.shortcut);
router.post('/:id/list', auth, chatGroupController.listToggle);
router.post('/:id/block', auth, chatGroupController.block);
router.post('/:id/report', auth, chatGroupController.report);
router.post('/:id/call', auth, chatGroupController.call);
router.post('/:id/leave', auth, chatGroupController.leave);
router.delete('/:id', auth, chatGroupController.delete);

export default router;
