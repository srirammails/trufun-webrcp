package org.eclipse.gef.client.standalone.example.model.commands;

import org.eclipse.draw2d.geometry.Rectangle;
import org.eclipse.gef.client.standalone.example.model.ChildModel;
import org.eclipse.gef.commands.Command;

public class LeftCommand extends Command {
	private Object model;
	private Rectangle oldRect, newRect;

	public LeftCommand(Object o) {
		model = o;
		oldRect = ((ChildModel) model).getConstraint();
		newRect = new Rectangle(oldRect);
		newRect.x = 0;
	}

	public void execute() {
		ChildModel childModel = (ChildModel) model;
		childModel.setConstraint(newRect);
	}

	// �I�[�o�[���C�h
	public boolean canUndo() {
		return true;
	}

	// �I�[�o�[���C�h
	public boolean canRedo() {
		return true;
	}

	// �I�[�o�[���C�h
	public void undo() {
		((ChildModel) model).setConstraint(oldRect);
	}
}
