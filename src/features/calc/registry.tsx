// Maps a ported calc id to its screen component. App.tsx looks up here
// instead of growing an if/else chain per calculator.

import type { ComponentType } from 'react';
import { EosEducation } from './eos/EosEducation';
import { FentonEducation } from './fenton/FentonEducation';
import { HieScreen } from './hie/HieScreen';
import { BpdScreen } from './bpd/BpdScreen';
import { NecScreen } from './nec/NecScreen';
import { PdaScreen } from './pda/PdaScreen';
import { RdsScreen } from './rds/RdsScreen';
import { IvhScreen } from './ivh/IvhScreen';
import { LosScreen } from './los/LosScreen';
import { RopScreen } from './rop/RopScreen';
import { SeizuresScreen } from './seizures/SeizuresScreen';
import { PocusScreen } from './pocus/PocusScreen';
import { KcmhScreen } from './kcmh/KcmhScreen';

export const CALC_SCREENS: Record<string, ComponentType<{ onBack?: () => void }>> = {
  eos: EosEducation,
  fenton: FentonEducation,
  hie: HieScreen,
  bpd: BpdScreen,
  nec: NecScreen,
  pda: PdaScreen,
  rds: RdsScreen,
  ivh: IvhScreen,
  los: LosScreen,
  rop: RopScreen,
  seizures: SeizuresScreen,
  pocus: PocusScreen,
  kcmh: KcmhScreen,
};
