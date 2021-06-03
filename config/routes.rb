require_dependency "discourse_basic_editor_constraint"

DiscourseBasicEditor::Engine.routes.draw do
  get "/" => "discourse_basic_editor#index", constraints: DiscourseBasicEditorConstraint.new
end
