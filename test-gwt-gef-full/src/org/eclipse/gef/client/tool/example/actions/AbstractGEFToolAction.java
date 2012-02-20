package org.eclipse.gef.client.tool.example.actions;

import org.eclipse.gef.EditDomain;
import org.eclipse.gef.Tool;
import org.eclipse.jface.action.Action;

public abstract class AbstractGEFToolAction extends Action {
	protected EditDomain editDomain;
	private Tool tool;

	public AbstractGEFToolAction(String text, EditDomain domain) {
		super(text, AS_CHECK_BOX);
		setToolTipText(text);
		editDomain = domain;
		tool = createTool();
	}

	// �c�[���̍쐬
	abstract protected Tool createTool();

	/*
	 * (�� Javadoc)
	 * 
	 * @see org.eclipse.jface.action.IAction#run()
	 */
	public void run() {
		// �쐬�����c�[�����A�N�e�B�u������
		editDomain.setActiveTool(tool);
	}

}
