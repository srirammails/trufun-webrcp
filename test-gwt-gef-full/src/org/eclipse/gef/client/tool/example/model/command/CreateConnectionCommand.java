package org.eclipse.gef.client.tool.example.model.command;

import org.eclipse.gef.client.tool.example.model.MyConnectionModel;
import org.eclipse.gef.client.tool.example.model.OrangeModel;
import org.eclipse.gef.commands.Command;

public class CreateConnectionCommand extends Command {
	private MyConnectionModel connection;
	private OrangeModel source, target;

	public void setConnection(Object connx) {
		connection = (MyConnectionModel) connx;
	}

	public void setSource(Object model) {
		source = (OrangeModel) model;
	}

	public void setTarget(Object model) {
		target = (OrangeModel) model;
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see org.eclipse.gef.commands.Command#execute()
	 */
	public void execute() {
		source.addSourceConnection(connection);
		target.addTargetConnection(connection);
	}
}
