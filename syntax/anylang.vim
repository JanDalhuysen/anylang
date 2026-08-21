" Vim syntax file for AnyLang
" Language: AnyLang (.al)

if exists("b:current_syntax")
  finish
endif

" Functions & definitions
syn keyword anylangFn function def fn fun func procedure proc void sub method
syn keyword anylangVar let const var val auto dynamic my
syn keyword anylangType int float double string bool boolean char byte long short

" Conditionals & Control flow
syn keyword anylangCond if when unless else otherwise elif elsif
syn keyword anylangRepeat while until repeat for foreach loop
syn keyword anylangReturn return give yield result

" Literals
syn keyword anylangBool true True TRUE yes false False FALSE no
syn keyword anylangNull null nil None undefined NULL

" Universal Standard Library Built-ins
syn keyword anylangBuiltin print println echo puts printf len size count str
syn keyword anylangBuiltin System fmt console

" Comments
syn match anylangComment "//.*$" contains=@Spell
syn region anylangComment start="/\*" end="\*/" contains=@Spell

" Strings
syn region anylangString start='"' end='"' skip='\\"' contains=@Spell
syn region anylangString start="'" end="'" skip="\\'" contains=@Spell

" Numbers
syn match anylangNumber "\v<[0-9]+(\.[0-9]+)?>"

" Operators
syn match anylangOperator "\v(\+|\-|\*|\/|\%|\=|\=\=|\=\=\=|\!\=|\!\=\=|\<|\>|\<\=|\>\=|\&\&|\|\||\!|\+=|\-=|\*=|/=|and|or|not|is)"

" Highlight Links
hi def link anylangFn Keyword
hi def link anylangVar StorageClass
hi def link anylangType Type
hi def link anylangCond Conditional
hi def link anylangRepeat Repeat
hi def link anylangReturn Statement
hi def link anylangBool Boolean
hi def link anylangNull Constant
hi def link anylangBuiltin Function
hi def link anylangComment Comment
hi def link anylangString String
hi def link anylangNumber Number
hi def link anylangOperator Operator

let b:current_syntax = "anylang"
