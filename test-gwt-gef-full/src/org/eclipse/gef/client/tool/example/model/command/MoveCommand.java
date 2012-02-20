package org.eclipse.gef.client.tool.example.model.command;

import org.eclipse.draw2d.geometry.Rectangle;
import org.eclipse.gef.client.tool.example.model.OrangeModel;
import org.eclipse.gef.commands.Command;

public class MoveCommand extends Command {
	private Object orange;
	private Rectangle constraint;

	public MoveCommand(Object model, Rectangle rect) {
		orange = model;
		constraint = rect;
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see org.eclipse.gef.commands.Command#execute()
	 */
	public void execute() {
		((OrangeModel) orange).setConstraint(constraint);
	}
}
