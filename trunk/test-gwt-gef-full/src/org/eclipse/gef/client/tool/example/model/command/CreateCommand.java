package org.eclipse.gef.client.tool.example.model.command;

import org.eclipse.draw2d.geometry.Dimension;
import org.eclipse.draw2d.geometry.Point;
import org.eclipse.draw2d.geometry.Rectangle;
import org.eclipse.gef.client.tool.example.model.CanvasModel;
import org.eclipse.gef.client.tool.example.model.OrangeModel;
import org.eclipse.gef.commands.Command;

public class CreateCommand extends Command {
	private Object orange, canvas;

	public CreateCommand(Object parent, Object child) {
		canvas = parent;
		orange = child;
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see org.eclipse.gef.commands.Command#execute()
	 */
	public void execute() {
		((CanvasModel) canvas).addChild(orange);
	}

	public void setLocation(Point pt) {
		setLocation(new Rectangle(pt, new Dimension(-1, -1)));
	}

	public void setLocation(Rectangle rect) {
		((OrangeModel) orange).setConstraint(rect);
	}
}
