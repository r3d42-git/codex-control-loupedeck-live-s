import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const projectRoot = resolve(import.meta.dirname, '..');
const source = JSON.parse(readFileSync(resolve(projectRoot, 'src/profile/architecture.json'), 'utf8'));
const profileFile = resolve(projectRoot, 'dist', `AI-Workspace-Live-S-${source.profile.version}.lp5`);
const extractionDirectory = mkdtempSync(resolve(tmpdir(), 'loupedeck-live-s-'));
const referenceFile = resolve(projectRoot, 'src/profile/fixtures/ChatGPT-manual-reference.lp5');
const codexKeybindingsFile = resolve(projectRoot, 'config/codex-keybindings.json');
const keyboardTouchAssignments = source.touchAssignments.filter((assignment) => assignment.actionType !== 'sendText');
const promptTouchAssignments = source.touchAssignments.filter((assignment) => assignment.actionType === 'sendText');
const appModeActionIdByTarget = { chatgpt: 64, work: 65, codex: 80 };
const directAppModeActionSpecs = source.roundButtonAssignments
  .filter((rule) => rule.type === 'appModeDirect')
  .map((rule) => ({
    ...rule,
    profileActionName: `$@Generic___@ProfileAction___${id(appModeActionIdByTarget[rule.target])}`
  }));
const taskNavigationActionSpecs = keyboardTouchAssignments.map((assignment, index) => ({
  ...assignment,
  profileActionName: `$@Generic___@ProfileAction___${id(66 + index)}`
}));
const promptMacroSpecs = promptTouchAssignments.map((assignment, index) => ({
  ...assignment,
  macroName: id(90 + index * 2),
  commandName: id(91 + index * 2),
  touchActionName: `$@Generic___@Macro___${id(90 + index * 2)}`
}));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function id(number) {
  return `A1C0DE50${String(number).padStart(24, '0')}`;
}

try {
  assert(existsSync(referenceFile), 'The Loupedeck-exported ChatGPT Live S reference profile is required for schema validation.');
  assert(existsSync(codexKeybindingsFile), 'The Codex keybinding template required by D02 is missing.');
  const codexKeybindings = JSON.parse(readFileSync(codexKeybindingsFile, 'utf8'));
  assert(JSON.stringify(codexKeybindings) === JSON.stringify([
    { command: 'composer.decreaseReasoningEffort', key: 'Command+Control+Alt+3' },
    { command: 'composer.increaseReasoningEffort', key: 'Command+Control+Alt+4' },
    { command: 'composer.togglePlanMode', key: 'Command+Control+Alt+5' },
    { command: 'composer.toggleFastMode', key: 'Command+Control+Alt+6' }
  ]), 'The Codex keybinding template contains unexpected commands or keys.');
  const baseline = JSON.parse(execFileSync('unzip', ['-p', referenceFile, 'ProfileInfo.json'], { encoding: 'utf8' }));
  const baselineMode = baseline.layout.layoutModes[0];

  execFileSync('unzip', ['-tqq', profileFile], { stdio: 'pipe' });
  execFileSync('unzip', ['-qq', profileFile, '-d', extractionDirectory], { stdio: 'pipe' });
  const profile = JSON.parse(readFileSync(resolve(extractionDirectory, 'ProfileInfo.json'), 'utf8'));
  const application = JSON.parse(readFileSync(resolve(extractionDirectory, 'ApplicationInfo.json'), 'utf8'));
  const mode = profile.layout.layoutModes[0];

  for (const key of Object.keys(baseline)) assert(key in profile, `Profile is missing required Live S schema key: ${key}`);
  assert(application.name === 'com.openai.codex', 'The package must bind to the locally registered ChatGPT application.');
  assert(application.processOrBundleName === 'com.openai.codex', 'The ChatGPT bundle identifier must be present for import resolution.');
  assert(application.nativePluginName === null && application.hasNativePlugin === false, 'The ChatGPT application binding must preserve its registered plugin settings.');
  assert(profile.applicationName === application.name, 'Profile and application binding must agree.');
  assert(application.defaultProfileName === profile.name, 'Application defaultProfileName must equal the imported profile identity.');
  assert(profile.deviceType === 'Loupedeck50', 'Profile must target Loupedeck50 (Live S).');
  assert(profile.layout.deviceType === 'Loupedeck50', 'Profile layout must target Loupedeck50 (Live S).');
  assert(mode.modeName === 'main', 'The imported profile must use the ChatGPT application mode.');
  assert(mode.touchPages.length === 1, 'Expected exactly one Codex touch mode.');
  assert(mode.encoderPages.length === 1, 'Expected exactly one Codex dial mode.');
  assert(mode.wheelPages.length === 1, 'The required compatibility wheel page must be retained from the working ChatGPT profile.');
  assert(mode.workspaces.length === 1, 'Expected exactly one Codex workspace.');
  assert(mode.homeWorkspaceName === mode.workspaces[0].name, 'Codex must be the home workspace.');
  assert(mode.workspaces[0].displayName === 'Codex', 'The first workspace must be Codex.');
  assert(mode.wheelPages[0].templateName === baselineMode.wheelPages[0].templateName, 'The compatibility wheel page must retain its working template.');
  for (const workspace of mode.workspaces) {
    assert(workspace.wheelPageNames.length === 1 && workspace.wheelPageNames[0] === mode.wheelPages[0].name, `${workspace.displayName} must retain the compatibility wheel-page reference.`);
  }

  const touchWorkspaceIds = source.workspaceContainers.flatMap((container) => container.pageIds);
  for (const [pageIndex, page] of mode.touchPages.entries()) {
    assert(page.controls.length === 15, `${page.displayName} must have 15 touch slots.`);
    const expectedActions = new Map([
      ...taskNavigationActionSpecs,
      ...promptMacroSpecs
    ].filter((assignment) => assignment.workspaceId === touchWorkspaceIds[pageIndex])
      .map((assignment) => [assignment.profileControlIndex, assignment.profileActionName ?? assignment.touchActionName]));
    for (const [controlIndex, control] of page.controls.entries()) {
      assert(control.fnPressAction === null, `${page.displayName} must not use the Fn layer.`);
      assert(control.pressAction === (expectedActions.get(controlIndex) ?? null), `Unexpected touch action at ${page.displayName} control ${controlIndex}.`);
    }
  }
  for (const [pageIndex, page] of mode.encoderPages.entries()) {
    assert(page.controls.length === baselineMode.encoderPages[0].controls.length, `${page.displayName} must retain the Live S encoder-schema control count.`);
    for (const [controlIndex, control] of page.controls.entries()) {
      const expectedRotateAction = pageIndex === 0 && controlIndex < 2
        ? `$@Generic___@MacroAdjustment___${id(61 + controlIndex)}`
        : null;
      const expectedPressAction = pageIndex === 0 && controlIndex === 0
        ? `$@Generic___@Macro___${id(63)}`
        : null;
      assert(
        control.pressAction === expectedPressAction && control.fnPressAction === null && control.rotateAction === expectedRotateAction && control.fnRotateAction === null,
        `Unexpected dial action at ${page.displayName} control ${controlIndex}.`
      );
    }
  }

  assert(profile.layout.roundPage.controls.length === baseline.layout.roundPage.controls.length, 'Round-button schema count must match the installed Live S profile.');
  assert(profile.layout.squarePage.controls.length === baseline.layout.squarePage.controls.length, 'Square-button schema must be retained for importer compatibility.');
  assert(JSON.stringify(directAppModeActionSpecs.map((specification) => specification.target)) === JSON.stringify(['chatgpt', 'work', 'codex']), 'Expected direct ChatGPT, Work and Codex side buttons.');
  const expectedActions = new Map(directAppModeActionSpecs.map((specification) => [
    specification.profileControlIndex,
    specification.profileActionName
  ]));
  for (const [index, control] of profile.layout.roundPage.controls.entries()) {
    assert(control.fnPressAction === null, 'Side-button Fn actions are not allowed.');
    assert(control.pressAction === (expectedActions.get(index) ?? null), `Unexpected action at Live S round control ${index}.`);
  }
  for (const control of profile.layout.squarePage.controls) {
    assert(control.pressAction === null && control.fnPressAction === null, 'Unused square controls must remain empty.');
  }
  assert(profile.macroCommands.length === 1 + promptMacroSpecs.length, 'Expected only the D01 confirmation macro and configured prompt macros.');
  const modelConfirmAction = profile.macroCommands.find((command) => command.name === id(63));
  assert(modelConfirmAction, 'The D01 confirmation macro is missing.');
  assert(modelConfirmAction.name === id(63), 'D01 press must reference the dedicated model-confirm macro.');
  assert(modelConfirmAction.displayName === 'Codex — Modell bestätigen', 'The D01 press macro must have the expected display name.');
  assert(modelConfirmAction.actions.length === 1 && modelConfirmAction.actionEditorCommands.length === 1, 'D01 confirmation must contain exactly one key action.');
  assert(modelConfirmAction.actions[0] === modelConfirmAction.actionEditorCommands[0].name, 'D01 confirmation must execute its single key action.');
  const modelConfirmKey = modelConfirmAction.actionEditorCommands[0].actionParameters.keyboardKey;
  assert(modelConfirmKey === 'Return___132105___Return___mac-36#¤%&+?0#¤%&+?\r#¤%&+?com.apple.keylayout.USInternational-PC', 'D01 press must use the native macOS Return key serialization.');
  assert(!modelConfirmKey.startsWith('Enter___'), 'D01 press must never serialize keypad Enter as Return.');
  for (const specification of promptMacroSpecs) {
    const promptMacro = profile.macroCommands.find((command) => command.name === specification.macroName);
    assert(promptMacro, `${specification.label} prompt macro is missing.`);
    assert(promptMacro.displayName === specification.label && promptMacro.description === specification.description, `${specification.label} prompt macro metadata differs from the architecture source.`);
    assert(promptMacro.actions.length === 1 && promptMacro.actions[0] === specification.commandName, `${specification.label} prompt macro must contain one text action.`);
    assert(promptMacro.actionEditorCommands.length === 1, `${specification.label} prompt macro must contain exactly one editor command.`);
    const textCommand = promptMacro.actionEditorCommands[0];
    assert(textCommand.name === specification.commandName && textCommand.templateName === '$@Generic___@SendText', `${specification.label} must use Loupedeck's native SendText action.`);
    assert(textCommand.actionParameters.text === specification.text && textCommand.actionParameters.useClipboard === 'false', `${specification.label} must insert its exact prompt without using the clipboard.`);
  }
  assert(profile.macroAdjustments.length === 2, 'Exactly two Codex dial adjustments are required.');
  const [modelAdjustment, effortAdjustment] = profile.macroAdjustments;
  assert(modelAdjustment.name === id(61) && modelAdjustment.displayName === 'Codex — Modell', 'D01 must reference the model adjustment.');
  assert(effortAdjustment.name === id(62) && effortAdjustment.displayName === 'Codex — Aufwand', 'D02 must reference the effort adjustment.');
  assert(modelAdjustment.actionsLeft.length === 2 && modelAdjustment.actionsRight.length === 2, 'Model rotation must use only open and direction in both directions.');
  assert(effortAdjustment.actionsLeft.length === 1 && effortAdjustment.actionsRight.length === 1, 'Effort rotation must emit exactly one shortcut per detent.');
  const modelKeys = modelAdjustment.actionEditorCommands.map((command) => command.actionParameters.keyboardKey);
  assert(JSON.stringify(modelKeys) === JSON.stringify([
    'Control+Shift+KeyM___1033___Ctrl+Shift+M___',
    'ArrowUp___1033___ArrowUp___',
    'Control+Shift+KeyM___1033___Ctrl+Shift+M___',
    'ArrowDown___1033___ArrowDown___'
  ]), 'D01 contains an unexpected model-picker key sequence.');
  const effortKeys = effortAdjustment.actionEditorCommands.map((command) => command.actionParameters.keyboardKey);
  assert(JSON.stringify(effortKeys) === JSON.stringify([
    'Command+Control+AltOrOption+Key3___1033___Cmd+Opt+Ctrl+3___',
    'Command+Control+AltOrOption+Key4___1033___Cmd+Opt+Ctrl+4___'
  ]), 'D02 contains unexpected reasoning-effort shortcuts.');
  for (const adjustment of profile.macroAdjustments) {
    assert(adjustment.actionsBefore.length === 0 && adjustment.actionsReset.length === 0, `${adjustment.displayName} must not add hidden pre-actions or a press/reset action.`);
    assert(adjustment.actionEditorCommands.every((command) => command.templateName === '$@Generic___@KeyboardKey'), `${adjustment.displayName} may contain keyboard commands only.`);
  }
  assert(profile.profileCommands.length === 0, 'No profile commands are allowed in this profile version.');
  assert(profile.profileActions.length === taskNavigationActionSpecs.length + directAppModeActionSpecs.length, 'Expected one direct keyboard profile action per Codex grid assignment plus three direct app-mode actions.');
  for (const specification of directAppModeActionSpecs) {
    const appModeAction = profile.profileActions.find((action) => action.name === specification.profileActionName);
    assert(appModeAction, `${specification.label} side-button action is missing.`);
    assert(appModeAction['$type'] === 'Loupedeck.Service.ApplicationProfileCommand, LoupedeckService', `${specification.label} must retain the direct keyboard-action schema.`);
    assert(appModeAction.displayName === specification.label && appModeAction.description === specification.description, `${specification.label} side-button metadata differs from the architecture source.`);
    assert(appModeAction.templateActionName === '$@Generic___@KeyboardKey' && appModeAction.actionParameters.count === 1, `${specification.label} must emit one direct keyboard shortcut.`);
    assert(appModeAction.actionParameters.parameters.keyboardKey === specification.loupedeckKeyboardKey, `${specification.label} uses the wrong direct app-mode shortcut.`);
    assert(appModeAction.isProfileAction === true && appModeAction.isMultiState === false, `${specification.label} must remain a single-state direct action.`);
  }
  for (const specification of taskNavigationActionSpecs) {
    const taskNavigationAction = profile.profileActions.find((action) => action.name === specification.profileActionName);
    assert(taskNavigationAction, `${specification.label} direct profile action is missing.`);
    assert(taskNavigationAction['$type'] === 'Loupedeck.Service.ApplicationProfileCommand, LoupedeckService', `${specification.label} must use the verified direct keyboard-action schema.`);
    assert(taskNavigationAction.displayName === specification.label && taskNavigationAction.description === specification.description, `${specification.label} metadata differs from the architecture source.`);
    assert(taskNavigationAction.templateActionName === '$@Generic___@KeyboardKey' && taskNavigationAction.actionParameters.count === 1, `${specification.label} must emit one direct keyboard shortcut.`);
    assert(taskNavigationAction.actionParameters.parameters.keyboardKey === specification.loupedeckKeyboardKey, `${specification.label} uses the wrong direct keyboard shortcut.`);
    assert(taskNavigationAction.isProfileAction === true && taskNavigationAction.isMultiState === false, `${specification.label} must remain a single-state direct action.`);
  }
  assert(profile.packageName === null && profile.packageVersion === null, 'Application profile package fields must match the working manual profile.');
  const actionColorsFile = resolve(extractionDirectory, 'ActionColors/ActionColors.json');
  assert(existsSync(actionColorsFile), 'The three user-selected app-mode colors must be packaged.');
  const actionColors = JSON.parse(readFileSync(actionColorsFile, 'utf8'));
  const expectedActionColors = Object.fromEntries(directAppModeActionSpecs.map((specification) => [
    specification.profileActionName,
    Number.parseInt(specification.color.slice(1), 16)
  ]));
  assert(JSON.stringify(actionColors) === JSON.stringify(expectedActionColors), 'The direct ChatGPT, Work and Codex side-button colors must remain red, yellow and green.');
  for (const specification of directAppModeActionSpecs) {
    const actionIconFile = resolve(extractionDirectory, `ActionIcons/${specification.profileActionName}.ict`);
    const sourceIconFile = resolve(projectRoot, 'src/icons', specification.icon);
    assert(existsSync(actionIconFile), `${specification.label} side-button icon must be packaged.`);
    const actionIcon = JSON.parse(readFileSync(actionIconFile, 'utf8'));
    assert(actionIcon.items.length === 2 && actionIcon.items[1].text === specification.label, `${specification.label} side-button icon must retain its visible label.`);
    assert(Buffer.from(actionIcon.items[0].image, 'base64').toString('utf8') === readFileSync(sourceIconFile, 'utf8'), `${specification.label} side-button icon must be generated from its editable SVG source.`);
  }
  for (const specification of taskNavigationActionSpecs) {
    const actionName = specification.profileActionName;
    const actionIconFile = resolve(extractionDirectory, `ActionIcons/${actionName}.ict`);
    const sourceIconFile = resolve(projectRoot, 'src/icons', specification.icon);
    assert(existsSync(actionIconFile), `${specification.label} action icon must be packaged.`);
    const actionIcon = JSON.parse(readFileSync(actionIconFile, 'utf8'));
    assert(actionIcon.items.length === 2 && actionIcon.items[1].text === specification.label, `${specification.label} action icon must retain its visible label.`);
    assert(Buffer.from(actionIcon.items[0].image, 'base64').toString('utf8') === readFileSync(sourceIconFile, 'utf8'), `${specification.label} action icon must be generated from its editable SVG source.`);
  }
  assert(readFileSync(resolve(extractionDirectory, 'metadata/AdvancedInfo.json'), 'utf8').includes('additionalPluginNames'), 'Package metadata must use the Profile5 advanced-info schema.');
  const packageMetadata = readFileSync(resolve(extractionDirectory, 'metadata/LoupedeckPackage.yaml'), 'utf8');
  assert(packageMetadata.includes(`name: ${profile.name}\n`), 'Package metadata name must equal the profile identity.');
  const preview = JSON.parse(readFileSync(resolve(extractionDirectory, 'metadata/ProfilePreview.json'), 'utf8'));
  assert(preview.buttonPages.length === 15 && preview.buttonPages.every((value) => value === null), 'Profile preview must retain the 15-button Live S shape.');
  assert(preview.encoderPages.length === baselineMode.encoderPages[0].controls.length && preview.encoderPages.every((value) => value === null), 'Profile preview must retain the exported encoder shape.');
  const archiveEntries = execFileSync('unzip', ['-Z1', profileFile], { encoding: 'utf8' }).trim().split('\n');
  assert(!archiveEntries.includes('metadata/'), 'The .lp5 must match Loupedeck export structure without an explicit directory entry.');
  console.log(`Validated ${profileFile}`);
} finally {
  rmSync(extractionDirectory, { recursive: true, force: true });
}
