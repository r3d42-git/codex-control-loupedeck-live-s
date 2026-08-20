import { existsSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const source = JSON.parse(readFileSync(resolve(projectRoot, 'src/profile/architecture.json'), 'utf8'));
const outputDirectory = resolve(projectRoot, 'dist');
const stagingDirectory = resolve(projectRoot, '.build/lp4');
const outputFile = resolve(outputDirectory, `AI-Workspace-Live-S-${source.profile.version}.lp5`);

// Exact .lp5 export produced by the locally installed Loupedeck 6.3 app from
// the user's working, manually created ChatGPT Live S profile.
const referenceFile = resolve(projectRoot, 'src/profile/fixtures/ChatGPT-manual-reference.lp5');

if (!existsSync(referenceFile)) {
  throw new Error('The Loupedeck-exported ChatGPT Live S reference profile was not found.');
}

const application = JSON.parse(execFileSync('unzip', ['-p', referenceFile, 'ApplicationInfo.json'], { encoding: 'utf8' }));
const baseline = JSON.parse(execFileSync('unzip', ['-p', referenceFile, 'ProfileInfo.json'], { encoding: 'utf8' }));
const baselineMode = baseline.layout.layoutModes[0];

function id(number) {
  return `A1C0DE50${String(number).padStart(24, '0')}`;
}

function clone(value) {
  return structuredClone(value);
}

function clearButtonControls(template, count) {
  return Array.from({ length: count }, () => ({
    ...clone(template),
    pressAction: null,
    fnPressAction: null
  }));
}

function clearEncoderControls(template, count) {
  return Array.from({ length: count }, () => ({
    ...clone(template),
    pressAction: null,
    fnPressAction: null,
    rotateAction: null,
    fnRotateAction: null
  }));
}

function keyboardCommand(name, keyboardKey) {
  return {
    '$type': 'Loupedeck.Service.MacroActionEditorCommand, LoupedeckService',
    name,
    templateName: '$@Generic___@KeyboardKey',
    actionParameters: {
      '$type': 'System.Collections.Generic.Dictionary`2[[System.String, System.Private.CoreLib],[System.String, System.Private.CoreLib]], System.Private.CoreLib',
      keyboardKey
    }
  };
}

function sendTextCommand(name, text) {
  return {
    '$type': 'Loupedeck.Service.MacroActionEditorCommand, LoupedeckService',
    name,
    templateName: '$@Generic___@SendText',
    actionParameters: {
      '$type': 'System.Collections.Generic.Dictionary`2[[System.String, System.Private.CoreLib],[System.String, System.Private.CoreLib]], System.Private.CoreLib',
      text,
      // The native SendText action leaves the user's clipboard untouched.
      useClipboard: 'false'
    }
  };
}

function macroAdjustment({ name, displayName, description, commands, actionsLeft, actionsRight }) {
  return {
    '$type': 'Loupedeck.Service.ApplicationProfileMacroAdjustment, LoupedeckService',
    isCommand: false,
    name,
    displayName,
    description,
    groupName: 'AI Workspace — Codex',
    superGroupName: '@macro',
    supportedOs: 'All',
    supportedModes: ['main'],
    showAsSingleAction: false,
    actionEditorCommands: commands,
    actionsBefore: [],
    actionsLeft,
    actionsRight,
    actionsReset: [],
    clickRateLimit: 9
  };
}

function macroCommand({ name, displayName, description, commands, actions }) {
  return {
    '$type': 'Loupedeck.Service.ApplicationProfileMacroCommand, LoupedeckService',
    isCommand: true,
    name,
    displayName,
    description,
    groupName: 'AI Workspace — Codex',
    superGroupName: '@macro',
    supportedOs: 'All',
    supportedModes: ['main'],
    showAsSingleAction: false,
    actionEditorCommands: commands,
    isMultiState: false,
    actions
  };
}

const buttonTemplate = baselineMode.touchPages[0].controls[0];
const encoderTemplate = baselineMode.encoderPages[0].controls[0];
const touchControlCount = baselineMode.touchPages[0].controls.length;
const encoderControlCount = baselineMode.encoderPages[0].controls.length;
const wheelTemplate = baselineMode.wheelPages[0];

if (!wheelTemplate) throw new Error('The supplied ChatGPT Live S profile does not contain the required compatibility wheel page.');

const modelOpenUpIds = [id(71), id(72)];
const modelOpenDownIds = [id(74), id(75)];
const effortIds = [id(77), id(78)];
const modelConfirmKeyId = id(79);
const keyboardTouchAssignments = source.touchAssignments.filter((assignment) => assignment.actionType !== 'sendText');
const promptTouchAssignments = source.touchAssignments.filter((assignment) => assignment.actionType === 'sendText');
const taskNavigationActions = keyboardTouchAssignments.map((assignment, index) => {
  const name = `$@Generic___@ProfileAction___${id(66 + index)}`;
  return {
    '$type': 'Loupedeck.Service.ApplicationProfileCommand, LoupedeckService',
    isCommand: true,
    name,
    templateActionName: '$@Generic___@KeyboardKey',
    actionParameters: {
      '$type': 'Loupedeck.ActionEditorActionParameters, PluginApi',
      parameters: {
        '$type': 'Loupedeck.StringDictionaryNoCase, PluginApi',
        keyboardKey: assignment.loupedeckKeyboardKey
      },
      count: 1
    },
    displayName: assignment.label,
    description: assignment.description,
    groupName: 'AI Workspace — Codex',
    superGroupName: '@macro',
    isProfileAction: true,
    isMultiState: false,
    isResetCommand: false,
    adjustmentName: null,
    states: null
  };
});
const taskNavigationActionByAssignmentId = new Map(keyboardTouchAssignments.map((assignment, index) => [
  assignment.id,
  taskNavigationActions[index]
]));
const promptMacroActions = promptTouchAssignments.map((assignment, index) => {
  const macroName = id(90 + index * 2);
  const commandName = id(91 + index * 2);
  return macroCommand({
    name: macroName,
    displayName: assignment.label,
    description: assignment.description,
    commands: [sendTextCommand(commandName, assignment.text)],
    actions: [commandName]
  });
});
const promptMacroActionByAssignmentId = new Map(promptTouchAssignments.map((assignment, index) => [
  assignment.id,
  promptMacroActions[index]
]));
const touchAssignmentsByWorkspaceId = new Map();
for (const assignment of source.touchAssignments) {
  const assignments = touchAssignmentsByWorkspaceId.get(assignment.workspaceId) ?? [];
  assignments.push(assignment);
  touchAssignmentsByWorkspaceId.set(assignment.workspaceId, assignments);
}
const modelConfirmAction = macroCommand({
  name: id(63),
  displayName: 'Codex — Modell bestätigen',
  description: 'Bestätigt die aktuell markierte Auswahl in der Codex-Modellauswahl.',
  commands: [
    // This is Loupedeck's native macOS serialization for hardware key code 36
    // (Return) with the keyboard layout active on the target Mac.
    keyboardCommand(modelConfirmKeyId, 'Return___132105___Return___mac-36#¤%&+?0#¤%&+?\r#¤%&+?com.apple.keylayout.USInternational-PC')
  ],
  actions: [modelConfirmKeyId]
});
const appModeActionIdByTarget = { chatgpt: 64, work: 65, codex: 80 };
const directAppModeRules = source.roundButtonAssignments.filter((rule) => rule.type === 'appModeDirect');
const directAppModeActions = directAppModeRules.map((rule) => ({
  '$type': 'Loupedeck.Service.ApplicationProfileCommand, LoupedeckService',
  isCommand: true,
  name: `$@Generic___@ProfileAction___${id(appModeActionIdByTarget[rule.target])}`,
  templateActionName: '$@Generic___@KeyboardKey',
  actionParameters: {
    '$type': 'Loupedeck.ActionEditorActionParameters, PluginApi',
    parameters: {
      '$type': 'Loupedeck.StringDictionaryNoCase, PluginApi',
      keyboardKey: rule.loupedeckKeyboardKey
    },
    count: 1
  },
  displayName: rule.label,
  description: rule.description,
  groupName: 'AI Workspace',
  superGroupName: '@macro',
  isProfileAction: true,
  isMultiState: false,
  isResetCommand: false,
  adjustmentName: null,
  states: null
}));
const directAppModeActionByTarget = new Map(directAppModeRules.map((rule, index) => [rule.target, directAppModeActions[index]]));
const modelAdjustment = macroAdjustment({
  name: id(61),
  displayName: 'Codex — Modell',
  description: 'Öffnet die Codex-Modellauswahl und wählt das vorherige oder nächste Modell.',
  commands: [
    keyboardCommand(modelOpenUpIds[0], 'Control+Shift+KeyM___1033___Ctrl+Shift+M___'),
    keyboardCommand(modelOpenUpIds[1], 'ArrowUp___1033___ArrowUp___'),
    keyboardCommand(modelOpenDownIds[0], 'Control+Shift+KeyM___1033___Ctrl+Shift+M___'),
    keyboardCommand(modelOpenDownIds[1], 'ArrowDown___1033___ArrowDown___')
  ],
  actionsLeft: modelOpenUpIds,
  actionsRight: modelOpenDownIds
});
const effortAdjustment = macroAdjustment({
  name: id(62),
  displayName: 'Codex — Aufwand',
  description: 'Verringert oder erhöht den Reasoning-Aufwand über zwei benutzerdefinierte Codex-Kurzbefehle.',
  commands: [
    keyboardCommand(effortIds[0], 'Command+Control+AltOrOption+Key3___1033___Cmd+Opt+Ctrl+3___'),
    keyboardCommand(effortIds[1], 'Command+Control+AltOrOption+Key4___1033___Cmd+Opt+Ctrl+4___')
  ],
  actionsLeft: [effortIds[0]],
  actionsRight: [effortIds[1]]
});
const dialAdjustmentsByContainer = new Map([
  ['codex', new Map([
    [0, modelAdjustment],
    [1, effortAdjustment]
  ])]
]);

function touchPage(workspace) {
  const page = clone(baselineMode.touchPages[0]);
  page.name = id({ codex: 11 }[workspace.id]);
  page.displayName = `${workspace.displayName} — Touch`;
  const assignments = touchAssignmentsByWorkspaceId.get(workspace.id) ?? [];
  page.description = assignments.length === 0
    ? 'Architecture shell — all 15 touch slots are intentionally unassigned.'
    : 'Codex task, composer and release-prompt controls.';
  page.controls = clearButtonControls(buttonTemplate, touchControlCount);
  for (const assignment of assignments) {
    const profileAction = taskNavigationActionByAssignmentId.get(assignment.id);
    const promptMacroAction = promptMacroActionByAssignmentId.get(assignment.id);
    if (!profileAction && !promptMacroAction) throw new Error(`No profile action was generated for touch assignment ${assignment.id}.`);
    page.controls[assignment.profileControlIndex].pressAction = profileAction?.name ?? `$@Generic___@Macro___${promptMacroAction.name}`;
  }
  page.dynamicPageName = null;
  page.dynamicPagePluginName = null;
  page.dynamicPageNumber = 0;
  return page;
}

function encoderPage(container) {
  const page = clone(baselineMode.encoderPages[0]);
  page.name = id({ codex: 21 }[container.id]);
  page.displayName = `${container.displayName} — Dials`;
  page.description = 'Codex controls — D01 selects the model and D02 changes reasoning effort.';
  // Loupedeck 6.3 stores six encoder controls in its Live S profile schema,
  // even though Live S exposes two physical dials. The unused schema controls
  // stay empty so the imported format remains compatible with the service.
  page.controls = clearEncoderControls(encoderTemplate, encoderControlCount);
  const assignments = dialAdjustmentsByContainer.get(container.id);
  if (assignments) {
    for (const [controlIndex, adjustment] of assignments) {
      page.controls[controlIndex].rotateAction = `$@Generic___@MacroAdjustment___${adjustment.name}`;
    }
    page.controls[0].pressAction = `$@Generic___@Macro___${modelConfirmAction.name}`;
  }
  page.dynamicPageName = null;
  page.dynamicPagePluginName = null;
  page.dynamicPageNumber = 0;
  return page;
}

const workspaceById = new Map(source.workspaces.map((workspace) => [workspace.id, workspace]));
const touchPages = source.workspaceContainers
  .flatMap((container) => container.pageIds)
  .map((workspaceId) => touchPage(workspaceById.get(workspaceId)));
const encoderPages = source.workspaceContainers.map(encoderPage);
const wheelPages = [
  {
    ...clone(wheelTemplate),
    name: id(51)
  }
];
const touchPageByWorkspaceId = new Map(source.workspaceContainers
  .flatMap((container) => container.pageIds)
  .map((workspaceId, index) => [workspaceId, touchPages[index]]));
const encoderPageByContainerId = new Map(source.workspaceContainers.map((container, index) => [container.id, encoderPages[index]]));

function workspace(container) {
  const entry = clone(baselineMode.workspaces[0]);
  entry.name = id({ codex: 31 }[container.id]);
  entry.displayName = container.displayName;
  entry.description = 'One Codex workspace with direct app-mode side buttons.';
  entry.touchPageNames = container.pageIds.map((workspaceId) => touchPageByWorkspaceId.get(workspaceId).name);
  entry.encoderPageNames = [encoderPageByContainerId.get(container.id).name];
  // Live S exposes no wheel hardware. This preserves the one internal page
  // from the working application-profile template, which the service expects
  // while activating a workspace. It never maps to D01 or D02.
  entry.wheelPageNames = [wheelPages[0].name];
  entry.activationActions = [];
  return entry;
}

const workspaces = source.workspaceContainers.map(workspace);
const workspaceByContainerId = new Map(source.workspaceContainers.map((container, index) => [container.id, workspaces[index]]));
const applicationModeName = baselineMode.modeName;

function roundButtonAction(rule) {
  if (rule.type === 'appModeDirect') {
    const action = directAppModeActionByTarget.get(rule.target);
    if (action) return action.name;
  }
  throw new Error(`Unsupported round-button assignment type: ${rule.type}`);
}

const roundButtonActions = new Map(source.roundButtonAssignments.map((rule) => [
  rule.profileControlIndex,
  roundButtonAction(rule)
]));

const mode = clone(baselineMode);
mode.modeName = applicationModeName;
mode.parentModeName = null;
mode.actions = null;
mode.dynamicButtonPages = null;
mode.dynamicEncoderPages = null;
mode.touchPages = touchPages;
mode.encoderPages = encoderPages;
mode.wheelPages = wheelPages;
mode.workspaces = workspaces;
mode.homeWorkspaceName = workspaceByContainerId.get('codex').name;

const roundPage = clone(baseline.layout.roundPage);
roundPage.name = id(41);
roundPage.displayName = 'Live S side buttons';
roundPage.description = 'The three right Live S side buttons switch directly to ChatGPT, Work and Codex; the left side button is unassigned.';
roundPage.controls = clearButtonControls(buttonTemplate, baseline.layout.roundPage.controls.length);
for (const [controlIndex, action] of roundButtonActions) roundPage.controls[controlIndex].pressAction = action;
roundPage.dynamicPageName = null;
roundPage.dynamicPagePluginName = null;
roundPage.dynamicPageNumber = 0;

const squarePage = clone(baseline.layout.squarePage);
squarePage.name = id(42);
squarePage.displayName = '';
squarePage.description = null;
squarePage.controls = clearButtonControls(buttonTemplate, baseline.layout.squarePage.controls.length);
squarePage.dynamicPageName = null;
squarePage.dynamicPagePluginName = null;
squarePage.dynamicPageNumber = 0;

const profile = clone(baseline);
profile.name = source.profile.id;
profile.profileFlags = 'None';
profile.displayName = source.profile.displayName;
profile.description = source.profile.description;
profile.deviceType = source.device.loupedeckDeviceType;
profile.applicationName = application.name;
profile.nativePluginName = application.nativePluginName;
profile.hasNativePlugin = application.hasNativePlugin;
profile.additionalNativePluginNames = clone(baseline.additionalNativePluginNames);
profile.lastModifiedTimeUtc = '2026-08-18T08:30:00.000Z';
profile.actionImages90 = null;
profile.actionImages60 = null;
profile.wheelImages = null;
profile.actionColors = null;
profile.layout = {
  ...clone(baseline.layout),
  deviceType: source.device.loupedeckDeviceType,
  profileFlags: 'None',
  layoutModes: [mode],
  roundPage,
  squarePage
};
profile.macroCommands = [modelConfirmAction, ...promptMacroActions];
profile.macroAdjustments = [modelAdjustment, effortAdjustment];
profile.profileCommands = [];
profile.profileAdjustments = [];
profile.profileActions = [...taskNavigationActions, ...directAppModeActions];
profile.conversionHistory = 'Generated from the locally working ChatGPT Live S profile schema; one Codex workspace, direct ChatGPT, Work and Codex app-mode buttons, Codex task, composer, Fast Mode, dictation and voice controls, two reviewed prompt controls and the two approved Codex dial controls are active.';
// Loupedeck's own manual and exported application profiles leave these null;
// the package identity belongs in LoupedeckPackage.yaml instead.
profile.packageName = null;
profile.packageVersion = null;

// Loupedeck 6.3's own .lp5 exporter uses one identity for the profile, the
// package metadata, and the application's default profile. Keeping these in
// lockstep is required for application resolution during import.
application.defaultProfileName = profile.name;

const packageMetadata = [
  'type: Profile5',
  `name: ${profile.name}`,
  `displayName: ${source.profile.displayName}`,
  `version: ${source.profile.version}`
].join('\n') + '\n';

const profilePreview = {
  buttonPages: Array(touchControlCount).fill(null),
  encoderPages: Array(encoderControlCount).fill(null)
};

const roundRuleById = new Map(source.roundButtonAssignments.map((rule) => [rule.controlId, rule]));
const colorNumber = (value) => Number.parseInt(value.slice(1), 16);
const actionColors = Object.fromEntries(directAppModeRules.map((rule) => [
  directAppModeActionByTarget.get(rule.target).name,
  colorNumber(roundRuleById.get(rule.controlId).color)
]));
function labelledActionIcon(iconFile, label) {
  return {
  backgroundColor: 4278190080,
  items: [
    {
      image: Buffer.from(readFileSync(iconFile, 'utf8')).toString('base64'),
      imageFileName: '',
      imageColor: 4294967295,
      imageRotation: 'None',
      isVisible: true,
      itemType: 'Image',
      area: { x: 9, y: 0, width: 82, height: 82 }
    },
    {
      text: label,
      originalText: null,
      textColor: 4294967295,
      fontSize: label.length > 10 ? 3 : 4,
      fontName: 'Arial',
      isVisible: true,
      itemType: 'Text',
      area: { x: 0, y: 81, width: 100, height: 18 }
    }
  ]
  };
}
const directAppModeActionIcons = directAppModeRules.map((rule) => ({
  actionName: directAppModeActionByTarget.get(rule.target).name,
  iconFile: resolve(projectRoot, 'src/icons', rule.icon),
  label: rule.label
}));
const taskNavigationActionIcons = source.touchAssignments.map((assignment) => {
  const profileAction = taskNavigationActionByAssignmentId.get(assignment.id);
  const promptMacroAction = promptMacroActionByAssignmentId.get(assignment.id);
  return {
    actionName: profileAction?.name ?? `$@Generic___@Macro___${promptMacroAction.name}`,
    iconFile: resolve(projectRoot, 'src/icons', assignment.icon),
    label: assignment.label
  };
});

rmSync(stagingDirectory, { recursive: true, force: true });
mkdirSync(resolve(stagingDirectory, 'metadata'), { recursive: true });
mkdirSync(resolve(stagingDirectory, 'ActionColors'), { recursive: true });
mkdirSync(resolve(stagingDirectory, 'ActionIcons'), { recursive: true });
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(resolve(stagingDirectory, 'ApplicationInfo.json'), `${JSON.stringify(application, null, 2)}\n`);
writeFileSync(resolve(stagingDirectory, 'ProfileInfo.json'), `${JSON.stringify(profile, null, 2)}\n`);
writeFileSync(resolve(stagingDirectory, 'metadata/LoupedeckPackage.yaml'), packageMetadata);
writeFileSync(resolve(stagingDirectory, 'metadata/ProfilePreview.json'), `${JSON.stringify(profilePreview, null, 4)}\n`);
writeFileSync(resolve(stagingDirectory, 'metadata/AdvancedInfo.json'), '{\n    "additionalPluginNames": []\n}\n');
writeFileSync(resolve(stagingDirectory, 'ActionColors/ActionColors.json'), `${JSON.stringify(actionColors, null, 2)}\n`);
for (const icon of directAppModeActionIcons) {
  writeFileSync(resolve(stagingDirectory, `ActionIcons/${icon.actionName}.ict`), `${JSON.stringify(labelledActionIcon(icon.iconFile, icon.label), null, 4)}\n`);
}
for (const icon of taskNavigationActionIcons) {
  writeFileSync(resolve(stagingDirectory, `ActionIcons/${icon.actionName}.ict`), `${JSON.stringify(labelledActionIcon(icon.iconFile, icon.label), null, 4)}\n`);
}

// ZIP stores per-file timestamps. Pin them so identical sources produce an
// identical .lp5 byte stream instead of a new checksum on every build.
const archiveTimestamp = new Date('2026-08-18T08:30:00.000Z');
for (const relativePath of [
  'ApplicationInfo.json',
  'ProfileInfo.json',
  'metadata/LoupedeckPackage.yaml',
  'metadata/ProfilePreview.json',
  'metadata/AdvancedInfo.json',
  'ActionColors/ActionColors.json',
  ...directAppModeActionIcons.map((icon) => `ActionIcons/${icon.actionName}.ict`),
  ...taskNavigationActionIcons.map((icon) => `ActionIcons/${icon.actionName}.ict`)
]) {
  utimesSync(resolve(stagingDirectory, relativePath), archiveTimestamp, archiveTimestamp);
}

rmSync(outputFile, { force: true });
execFileSync('zip', [
  '-X', '-q', outputFile,
  'ApplicationInfo.json',
  'ProfileInfo.json',
  'metadata/LoupedeckPackage.yaml',
  'metadata/ProfilePreview.json',
  'metadata/AdvancedInfo.json',
  'ActionColors/ActionColors.json',
  ...directAppModeActionIcons.map((icon) => `ActionIcons/${icon.actionName}.ict`),
  ...taskNavigationActionIcons.map((icon) => `ActionIcons/${icon.actionName}.ict`)
], { cwd: stagingDirectory });
console.log(`Built ${outputFile}`);
