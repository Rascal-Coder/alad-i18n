import { Rule } from 'eslint'
import { EntryStatus, ReplaceType } from '../../store/types'

export type ReplaceTextParams = {
  node: Rule.Node | any
  entryStatus: EntryStatus
  context: Rule.RuleContext
  replaceType: ReplaceType
  isTemplate?: boolean
}
