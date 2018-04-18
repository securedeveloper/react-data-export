import React from 'react';
import { shallow } from 'enzyme';

import ExcelColumn from '../../src/ExcelPlugin/elements/ExcelColumn';

describe('React Data Export unit test', () => {

    test('should render ExcelColumn', () => {
        const wrapper = shallow(<ExcelColumn
            label={'test'}
            value={'test'}
        />);

        expect(wrapper.html()).toMatchSnapshot();
    });

});
