import { usePlugin } from '@/main';
import { jumpToNextDailyNote, jumpToPrevDailyNote } from '@/utils/DailyNoteHelper';

export const registerShortcutKey = () => {
  const plugin = usePlugin()
  plugin.addCommand({
    langKey: "goPrevDailyNote",
    hotkey: "⌥⌘↑",
    callback: () => {
      jumpToPrevDailyNote();
    },
  });
  plugin.addCommand({
    langKey: "goNextDailyNote",
    hotkey: "⌥⌘↓",
    callback: () => {
      jumpToNextDailyNote();
    },
  });
}
