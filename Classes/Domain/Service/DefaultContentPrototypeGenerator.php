<?php
namespace Neos\Neos\Domain\Service;

/*
 * This file is part of the Neos.Neos package.
 *
 * (c) Contributors of the Neos Project - www.neos.io
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */

use Neos\Flow\Annotations as Flow;

/**
 * Generate a Fusion prototype definition based on Neos.Neos:Content
 *
 * @Flow\Scope("singleton")
 * @deprecated will be removed with Neos 6
 * @api
 */
class DefaultContentPrototypeGenerator extends DefaultPrototypeGenerator
{
    /**
     * The Name of the prototype that is extended
     *
     * @var string
     */
    protected $basePrototypeName = 'Neos.Neos:Content';

    /**
     * The template path in the package where templates are found
     *
     * @var string
     */
    protected $templatePath = 'Private/Templates/NodeTypes';
}
