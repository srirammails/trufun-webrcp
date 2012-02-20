package org.eclipse.gef.client.tool.example.actions;

import org.eclipse.gef.EditDomain;
import org.eclipse.gef.SharedImages;
import org.eclipse.gef.Tool;
import org.eclipse.gef.tools.SelectionTool;

public class SelectionToolAction extends AbstractGEFToolAction {

	public SelectionToolAction(String text, EditDomain domain) {
		super(text, domain);
		setImageDescriptor(SharedImages.DESC_SELECTION_TOOL_16);
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see tool.example.actions.AbstractGEFToolAction#createTool()
	 */
	protected Tool createTool() {
		SelectionTool tool = new SelectionTool() {
			/*
			 * (�� Javadoc)
			 * 
			 * @see org.eclipse.gef.tools.AbstractTool#activate()
			 */
			public void activate() {
				setChecked(true);
				super.activate();
			}

			/*
			 * (�� Javadoc)
			 * 
			 * @see org.eclipse.gef.tools.SelectionTool#deactivate()
			 */
			public void deactivate() {
				setChecked(false);
				super.deactivate();
			}
		};

		// ���̃c�[�����f�t�H���g�ɂ���
		editDomain.setDefaultTool(tool);

		// �����ԂŃ{�^�������܂���ׂɃA�N�e�B�u������
		editDomain.setActiveTool(tool);

		return tool;
	}
}
